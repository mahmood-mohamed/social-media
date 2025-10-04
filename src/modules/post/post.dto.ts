export interface ICreatePostDto {
  content: string;
  attachments?: string[]; // TODO: add type
}

export interface IUpdatePostDto {
  content?: string;
  attachments?: string[]; // TODO: add type
}

