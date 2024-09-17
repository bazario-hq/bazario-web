import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { ProductCarousel } from '../../components/ProductCarousel';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle(undefined);
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/home')));

  return (
    <>

      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}

      {data && (
        <>
          <Row className="g-2 mb-5 home-categories">
            {data.categories.map((c) => (
              <Col xs={6} md={3} lg={2} key={c.id}>
                <Link to={`/c/${c.slug}`} className="category-tile">
                  {c.name}
                </Link>
              </Col>
            ))}
          </Row>

          <ProductCarousel title="Today's deals" icon="tag" products={data.deals} moreLink="/search?sort=price_asc" />
          <ProductCarousel title="Trending now" icon="fire" products={data.trending} moreLink="/search?sort=popular" />
          <ProductCarousel title="New arrivals" icon="box" products={data.newArrivals} moreLink="/search?sort=newest" />
          <ProductCarousel title="Top rated" icon="star" products={data.topRated} moreLink="/search?sort=rating" />
        </>
      )}
    </>
  );
}
