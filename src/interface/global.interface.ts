export interface IGlobalResponse<T = unknown> {
  status: boolean;
  message: string;
  data?: any;
  pagination?: IPagination;
  error?: IErrorDetail | IErrorDetail[];
}

export interface IPagination {
  total: number;
  curreentPage: number;
  perPage: number;
  totalPage: number;
}

export interface IErrorDetail {
  message: string;
  field?: string;
}

export type TGlobalResponse<T = unknown> = IGlobalResponse<T>;
