import React from 'react';
import { useActivityAuditLogController } from './ActivityAuditLog.controller';
import { ActivityAuditLogView } from './ActivityAuditLog.view';

export const ActivityAuditLog: React.FC = () => {
  const controller = useActivityAuditLogController();
  return <ActivityAuditLogView controller={controller} />;
};

export { useActivityAuditLogController } from './ActivityAuditLog.controller';
export type { ActivityAuditLogController } from './ActivityAuditLog.controller';
export { ActivityAuditLogView } from './ActivityAuditLog.view';
