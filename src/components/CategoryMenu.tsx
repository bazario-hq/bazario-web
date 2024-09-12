import { NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { flattenCategories } from '../lib/categories';

export function CategoryMenu() {
  const { categories } = useApp();
  const top = flattenCategories(categories).filter((c) => c.depth === 0);

  return (
    <NavDropdown title="Categories" id="category-menu">
      {top.map((c) => (
        <NavDropdown.Item as={Link} to={`/c/${c.slug}`} key={c.id}>
          {c.name}
        </NavDropdown.Item>
      ))}
      {top.length === 0 && <NavDropdown.ItemText className="text-muted">No categories yet</NavDropdown.ItemText>}
    </NavDropdown>
  );
}
