/**
 * Central model registry.
 *
 * ALL models are exported from here. Association methods use require('../index')
 * to avoid circular-import issues at definition time — associations are wired
 * after every model class is loaded.
 *
 * Registration order matters for FK constraints:
 *   Role → Permission → File → User → junction tables → dependent tables
 */

export { Role }           from './role/role.model';
export { Permission }     from './permission/permission.model';
export { RolePermission } from './permission/role-permission.model';
export { File }           from './file/file.model';
export { User }           from './user/user.model';
export { UserRole }       from './user/user-role.model';
export { ActivityLog }    from './activity-log/activity-log.model';
export { Notification }   from './notification/notification.model';
export { Setting }        from './setting/setting.model';
