import { environment } from '../../../../environments/environment';

export const createUrl = (url: string): string => {
  return `${environment.apiUrl}${url}`;
};
