import { useState, type FormEvent } from 'react';
import { Badge, Button, Container, Form, InputGroup, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../lib/format';
import { CategoryMenu } from './CategoryMenu';
import { Icon } from './Icon';

export function Header() {
  const { user, cart, unread, logout } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : '/search');
  }

  async function onLogout() {
    await logout();
    navigate('/');
  }

  const seller = user?.seller;

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="site-header" sticky="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand">
          Bazario
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-nav" />
        <Navbar.Collapse id="main-nav">
          <Nav className="me-3">
            <CategoryMenu />
          </Nav>
          <Form className="flex-grow-1 me-lg-3 my-2 my-lg-0" onSubmit={onSearch} role="search">
            <InputGroup>
              <Form.Control
                type="search"
                placeholder="Search products"
                aria-label="Search products"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" variant="warning" aria-label="Search">
                <Icon name="search" />
              </Button>
            </InputGroup>
          </Form>
          <Nav className="align-items-lg-center">
            <Nav.Link as={NavLink} to="/wishlist" aria-label="Wishlist">
              <Icon name="heart" />
              <span className="d-lg-none ms-2">Wishlist</span>
            </Nav.Link>
            <Nav.Link as={NavLink} to="/cart" aria-label="Cart" data-testid="cart-link">
              <Icon name="cart" />
              {cart && cart.itemCount > 0 && (
                <Badge bg="warning" text="dark" pill className="ms-1" data-testid="cart-count">
                  {cart.itemCount}
                </Badge>
              )}
              <span className="d-lg-none ms-2">Cart</span>
            </Nav.Link>
            {user && (
              <Nav.Link
                as={NavLink}
                to="/notifications"
                aria-label="Notifications"
              >
                <Icon name="bell" />
                {unread.count > 0 && (
                  <Badge bg="danger" pill className="ms-1" data-testid="unread-count">
                    {unread.count > 99 ? '99+' : unread.count}
                  </Badge>
                )}
              </Nav.Link>
            )}
            {user ? (
              <NavDropdown
                align="end"
                id="account-menu"
                title={
                  <span>
                    <Icon name="user" className="me-1" />
                    {user.name.split(' ')[0]}
                  </span>
                }
              >
                <NavDropdown.Item as={Link} to="/orders">
                  My orders
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/account">
                  Account
                </NavDropdown.Item>
                <NavDropdown.Divider />
                {seller?.status === 'active' ? (
                  <NavDropdown.Item as={Link} to="/seller">
                    Seller dashboard
                  </NavDropdown.Item>
                ) : (
                  <NavDropdown.Item as={Link} to="/sell">
                    {seller ? 'Seller application' : 'Sell on Bazario'}
                  </NavDropdown.Item>
                )}
                {user.role === 'admin' && (
                  <NavDropdown.Item as={Link} to="/admin">
                    Admin
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={onLogout}>
                  <Icon name="signOut" className="me-1" /> Log out
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={NavLink} to="/login">
                  Log in
                </Nav.Link>
                <Link to="/signup" className="btn btn-warning btn-sm ms-lg-2">
                  Sign up
                </Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
