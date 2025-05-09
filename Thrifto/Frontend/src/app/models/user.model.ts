// src/app/models/user.model.ts
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  token?: string;
}
