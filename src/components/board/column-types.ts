export type BoardColumn = {
  id: string;
  name: string;
  position: number;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  wipLimit: number | null;
  boardId: string;
};
