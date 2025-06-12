import { Nav } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';

export function AdminLayout() {
  return (
    <>
      <Nav variant="tabs" className="mb-4" aria-label="Admin navigation">
        <Nav.Link as={NavLink} to="/admin/users">
          Users
        </Nav.Link>
        <Nav.Link as={NavLink} to="/admin/sellers">
          Sellers
        </Nav.Link>
        <Nav.Link as={NavLink} to="/admin/reviews">
          Reviews
        </Nav.Link>
        <Nav.Link as={NavLink} to="/admin/audit-log">
          Audit log
        </Nav.Link>
      </Nav>
      <Outlet />
    </>
  );
}
