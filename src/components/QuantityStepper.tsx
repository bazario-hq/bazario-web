import { Button, InputGroup, Form } from 'react-bootstrap';
import { Icon } from './Icon';

export function QuantityStepper({ value, max, onChange, disabled, label = 'Quantity' }: { value: number; max: number; onChange: (n: number) => void; disabled?: boolean; label?: string }) {
  return (
    <InputGroup size="sm" className="quantity-stepper" style={{ width: 120 }}>
      <Button variant="outline-secondary" aria-label="Decrease quantity" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)}>
        <Icon name="minus" />
      </Button>
      <Form.Control aria-label={label} className="text-center" value={value} readOnly />
      <Button variant="outline-secondary" aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" />
      </Button>
    </InputGroup>
  );
}
