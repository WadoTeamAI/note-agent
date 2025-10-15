/**
 * チーム管理サービス（Phase 2.5）
 * チーム作成、メンバー管理、承認ワークフロー機能
 */

import { supabase } from '../database/supabaseClient';
import { 
  Team, 
  TeamSettings, 
  CollaboratorUser, 
  DocumentVersion,
  ApprovalRecord,
  ApprovalStatus,
  UserRole,
  Permission,
  Notification
} from '../../types/collaboration.types';

export class TeamService {
  /**
   * 新しいチームを作成
   */
  async createTeam(
    name: string, 
    description: string, 
    creator: CollaboratorUser,
    settings?: Partial<TeamSettings>
  ): Promise<Team | null> {
    if (!supabase) {
      console.warn('Supabase not available');
      return null;
    }

    try {
      const defaultSettings: TeamSettings = {
        allowPublicJoin: false,
        requireApprovalForPublish: true,
        defaultRole: UserRole.VIEWER,
        approvalThreshold: 1,
        enableComments: true,
        enableVersionHistory: true,
        ...settings
      };

      // チーム作成
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name,
          description,
          settings: defaultSettings,
          created_by: creator.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 作成者をオーナーとして追加
      await this.addTeamMember(teamData.id, creator.id, UserRole.OWNER);

      const team: Team = {
        id: teamData.id,
        name: teamData.name,
        description: teamData.description,
        members: [{ ...creator, role: UserRole.OWNER }],
        createdAt: new Date(teamData.created_at),
        settings: teamData.settings
      };

      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  /**
   * チーム情報を取得
   */
  async getTeam(teamId: string): Promise<Team | null> {
    if (!supabase) return null;

    try {
      const { data: teamData, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_members(
            user_id,
            role,
            joined_at
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;

      // メンバー情報を取得
      const members: CollaboratorUser[] = [];
      for (const member of teamData.team_members) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email, avatar')
          .eq('id', member.user_id)
          .single();

        if (userData) {
          members.push({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            role: member.role,
            status: 'offline',
            lastSeen: new Date(member.joined_at)
          });
        }
      }

      const team: Team = {
        id: teamData.id,
        name: teamData.name,
        description: teamData.description,
        members,
        createdAt: new Date(teamData.created_at),
        settings: teamData.settings
      };

      return team;
    } catch (error) {
      console.error('Error fetching team:', error);
      return null;
    }
  }

  /**
   * チームメンバーを追加
   */
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: UserRole = UserRole.VIEWER
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role
        });

      if (error) throw error;

      // 通知を送信
      await this.sendNotification(userId, {
        type: 'team-invitation',
        title: 'チームに招待されました',
        message: `新しいチームのメンバーに追加されました`,
        teamId
      });

      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      return false;
    }
  }

  /**
   * チームメンバーの役割を変更
   */
  async updateMemberRole(
    teamId: string, 
    userId: string, 
    newRole: UserRole, 
    requesterId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 権限チェック
      const hasPermission = await this.checkPermission(requesterId, teamId, 'canChangeSettings');
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // 通知を送信
      await this.sendNotification(userId, {
        type: 'role-changed',
        title: '役割が変更されました',
        message: `チーム内での役割が${newRole}に変更されました`,
        teamId
      });

      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      return false;
    }
  }

  /**
   * チームメンバーを削除
   */
  async removeTeamMember(
    teamId: string, 
    userId: string, 
    requesterId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 権限チェック（オーナーまたは本人のみ）
      const isOwner = await this.checkPermission(requesterId, teamId, 'canChangeSettings');
      const isSelf = requesterId === userId;
      
      if (!isOwner && !isSelf) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  }

  /**
   * 文書の承認を要求
   */
  async requestApproval(
    documentId: string,
    version: DocumentVersion,
    teamId: string,
    requesterId: string,
    message?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 承認要求レコードを作成
      const { data: approvalData, error } = await supabase
        .from('approval_requests')
        .insert({
          document_id: documentId,
          version_id: version.id,
          team_id: teamId,
          requester_id: requesterId,
          message,
          status: ApprovalStatus.PENDING
        })
        .select()
        .single();

      if (error) throw error;

      // チームの承認者に通知
      const team = await this.getTeam(teamId);
      if (team) {
        const approvers = team.members.filter(
          member => member.role === UserRole.OWNER || member.role === UserRole.EDITOR
        );

        for (const approver of approvers) {
          if (approver.id !== requesterId) {
            await this.sendNotification(approver.id, {
              type: 'approval-request',
              title: '承認要求',
              message: `「${version.title}」の承認が要求されています`,
              documentId,
              actionUrl: `/documents/${documentId}/approval/${approvalData.id}`
            });
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting approval:', error);
      return false;
    }
  }

  /**
   * 文書を承認/却下
   */
  async processApproval(
    approvalRequestId: string,
    approverId: string,
    action: 'approved' | 'rejected',
    comment?: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 承認記録を作成
      const approvalRecord: Omit<ApprovalRecord, 'timestamp'> = {
        approverId,
        approverName: '', // 実際の実装では取得
        status: action,
        comment
      };

      const { data: approvalData, error: approvalError } = await supabase
        .from('approval_records')
        .insert({
          approval_request_id: approvalRequestId,
          approver_id: approverId,
          status: action,
          comment
        })
        .select()
        .single();

      if (approvalError) throw approvalError;

      // 承認要求の状態を更新
      const { data: requestData, error: updateError } = await supabase
        .from('approval_requests')
        .update({ 
          status: action === 'approved' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
          completed_at: new Date().toISOString()
        })
        .eq('id', approvalRequestId)
        .select('requester_id, document_id')
        .single();

      if (updateError) throw updateError;

      // 要求者に通知
      await this.sendNotification(requestData.requester_id, {
        type: action === 'approved' ? 'approval-granted' : 'approval-rejected',
        title: action === 'approved' ? '承認されました' : '却下されました',
        message: action === 'approved' 
          ? '文書が承認され、公開可能になりました'
          : `文書が却下されました: ${comment || '理由なし'}`,
        documentId: requestData.document_id
      });

      return true;
    } catch (error) {
      console.error('Error processing approval:', error);
      return false;
    }
  }

  /**
   * ユーザーの権限を確認
   */
  async getUserPermissions(userId: string, teamId: string): Promise<Permission> {
    const defaultPermissions: Permission = {
      canEdit: false,
      canComment: false,
      canApprove: false,
      canInvite: false,
      canChangeSettings: false,
      canDelete: false,
      canPublish: false
    };

    if (!supabase) return defaultPermissions;

    try {
      const { data: memberData } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (!memberData) return defaultPermissions;

      const role = memberData.role as UserRole;

      switch (role) {
        case UserRole.OWNER:
          return {
            canEdit: true,
            canComment: true,
            canApprove: true,
            canInvite: true,
            canChangeSettings: true,
            canDelete: true,
            canPublish: true
          };
        case UserRole.EDITOR:
          return {
            canEdit: true,
            canComment: true,
            canApprove: true,
            canInvite: false,
            canChangeSettings: false,
            canDelete: false,
            canPublish: false
          };
        case UserRole.REVIEWER:
          return {
            canEdit: false,
            canComment: true,
            canApprove: true,
            canInvite: false,
            canChangeSettings: false,
            canDelete: false,
            canPublish: false
          };
        case UserRole.VIEWER:
        default:
          return {
            canEdit: false,
            canComment: false,
            canApprove: false,
            canInvite: false,
            canChangeSettings: false,
            canDelete: false,
            canPublish: false
          };
      }
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return defaultPermissions;
    }
  }

  /**
   * 権限チェック
   */
  private async checkPermission(
    userId: string, 
    teamId: string, 
    permission: keyof Permission
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, teamId);
    return permissions[permission];
  }

  /**
   * 通知を送信
   */
  private async sendNotification(
    userId: string, 
    notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'> & { 
      teamId?: string;
      documentId?: string;
    }
  ): Promise<void> {
    if (!supabase) return;

    try {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        document_id: notification.documentId,
        team_id: notification.teamId,
        action_url: notification.actionUrl,
        is_read: false
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * チーム設定を更新
   */
  async updateTeamSettings(
    teamId: string, 
    settings: Partial<TeamSettings>, 
    requesterId: string
  ): Promise<boolean> {
    if (!supabase) return false;

    try {
      // 権限チェック
      const hasPermission = await this.checkPermission(requesterId, teamId, 'canChangeSettings');
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      const { error } = await supabase
        .from('teams')
        .update({ settings })
        .eq('id', teamId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating team settings:', error);
      return false;
    }
  }

  /**
   * チームの統計情報を取得
   */
  async getTeamStats(teamId: string): Promise<{
    memberCount: number;
    documentsCount: number;
    pendingApprovals: number;
    recentActivity: number;
  }> {
    if (!supabase) {
      return { memberCount: 0, documentsCount: 0, pendingApprovals: 0, recentActivity: 0 };
    }

    try {
      const [memberCount, documentsCount, pendingApprovals, recentActivity] = await Promise.all([
        // メンバー数
        supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
        // 文書数
        supabase.from('team_documents').select('*', { count: 'exact', head: true }).eq('team_id', teamId),
        // 承認待ち数
        supabase.from('approval_requests').select('*', { count: 'exact', head: true })
          .eq('team_id', teamId).eq('status', ApprovalStatus.PENDING),
        // 最近の活動（過去7日間）
        supabase.from('collaboration_logs').select('*', { count: 'exact', head: true })
          .eq('team_id', teamId)
          .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ]);

      return {
        memberCount: memberCount.count || 0,
        documentsCount: documentsCount.count || 0,
        pendingApprovals: pendingApprovals.count || 0,
        recentActivity: recentActivity.count || 0
      };
    } catch (error) {
      console.error('Error fetching team stats:', error);
      return { memberCount: 0, documentsCount: 0, pendingApprovals: 0, recentActivity: 0 };
    }
  }
}

// シングルトンインスタンス
export const teamService = new TeamService();