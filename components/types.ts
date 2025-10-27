export interface Item {
  id: string;
  content: string;
  children?: Item[];
}
