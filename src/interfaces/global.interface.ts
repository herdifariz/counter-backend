// Global response interface
export interface IGlobalResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: T;
  pagination?: IPagination;
  error?: IErrorDetail | IErrorDetail[];
}

// Pagination interface
export interface IPagination {
  total: number;
  current_page: number;
  total_page: number;
  per_page: number;
}

// Error detail interface
export interface IErrorDetail {
  message: string;
  field?: string;
}

// Type aliases for better readability
export type TGlobalResponse<T = unknown> = IGlobalResponse<T>;
