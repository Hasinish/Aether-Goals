export interface DeadlineProps {
  id: string;
  title: string;
  sub: string;
  priority: string;
  due: number;
  total: number;
  completed: boolean;
  onToggle?: () => void;
  onClick?: () => void;
}
