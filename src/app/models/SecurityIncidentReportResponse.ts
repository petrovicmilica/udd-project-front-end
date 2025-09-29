export interface SecurityIncidentReportResponse {
  employeeName: string;
  securityOrganizationName: string;
  affectedOrganizationName: string;
  severityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  affectedOrganizationAddress: string;
  reportContent: string;
}