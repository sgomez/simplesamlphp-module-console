import { Button } from 'react-aria-components';

interface AddButtonProps {
  // What it adds, in full, for its accessible name and tooltip.
  title?: string;
  children: string;
  onPress: () => void;
}

// A dashed button that adds the thing it names.
export function AddButton({ title, children, onPress }: AddButtonProps) {
  return (
    <Button className="opt-add" onPress={onPress} aria-label={`Add ${children}`} {...(title ? { title } : {})}>
      <span aria-hidden="true">+</span>
      {children}
    </Button>
  );
}
