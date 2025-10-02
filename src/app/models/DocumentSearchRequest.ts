export interface DocumentSearchRequest {
  searchKeywords: string[];
  booleanQuery: string;
  radius: number;
}