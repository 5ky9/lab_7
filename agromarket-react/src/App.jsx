import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from './api.js';
import AddProductForm from './components/AddProductForm.jsx';
import ChangePasswordForm from './components/ChangePasswordForm.jsx';
import LoginForm from './components/LoginForm.jsx';
import MyOrders from './components/MyOrders.jsx';
import OrdersPanel from './components/OrdersPanel.jsx';
import OrderForm from './components/OrderForm.jsx';

const money = new Intl.NumberFormat('ru-RU');

function readSavedUser() {
  if (!localStorage.getItem('token')) {
    localStorage.removeItem('user');
    return null;
  }
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return null;
  }
}

function App() {
  const [user, setUser] = useState(readSavedUser);
  const [checkingSession, setCheckingSession] = useState(Boolean(localStorage.getItem('token')));
  const [products, setProducts] = useState([]);
  const [productsError, setProductsError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch('/products')
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((error) => {
        if (active) setProductsError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setCheckingSession(false);
      setNotice('Срок действия входа закончился. Войдите снова.');
    };
    window.addEventListener('agromarket:unauthorized', onUnauthorized);
    return () => window.removeEventListener('agromarket:unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      return undefined;
    }

    let active = true;
    apiFetch('/auth/me')
      .then((currentUser) => {
        if (!active) return;
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru');
    if (!query) return products;
    return products.filter((product) =>
      `${product.name} ${product.category || ''}`.toLocaleLowerCase('ru').includes(query)
    );
  }, [products, search]);

  function handleLogin(nextUser, token) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(nextUser));
    setUser(nextUser);
    setNotice(`Добро пожаловать, ${nextUser.name}!`);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setNotice('Вы вышли из аккаунта.');
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return;
    try {
      await apiFetch(`/products/${product.id}`, { method: 'DELETE' });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice('Товар удалён.');
    } catch (error) {
      setNotice(error.message);
    }
  }

  function handleProductSaved(savedProduct) {
    setProducts((current) => {
      const exists = current.some((item) => item.id === savedProduct.id);
      return exists
        ? current.map((item) => item.id === savedProduct.id ? savedProduct : item)
        : [...current, savedProduct].sort((a, b) => a.id - b.id);
    });
    setEditingProduct(null);
    setShowProductForm(false);
    setNotice('Каталог обновлён.');
  }

  const greeting = user ? (
    <div className="account-panel">
      <div className="account-copy">
        <span className="eyebrow">АККАУНТ</span>
        <strong>{user.name}</strong>
        <span>{user.role === 'admin' ? 'Администратор' : 'Покупатель'}</span>
      </div>
      <button className="button button-outline button-small" onClick={handleLogout}>Выйти</button>
    </div>
  ) : null;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="АгроМаркет — главная">
          <span className="brand-mark" aria-hidden="true">А</span>
          <span><strong>АгроМаркет</strong><small>вкус рядом</small></span>
        </a>
        <nav className="main-nav" aria-label="Основная навигация">
          <a href="#catalog">Каталог</a>
          {user && <a href={user.role === 'admin' ? '#orders' : '#my-orders'}>Заявки</a>}
        </nav>
        {checkingSession ? (
          <span className="session-status">Проверяем вход…</span>
        ) : user ? greeting : (
          <a className="button button-dark button-small header-login" href="#login">Войти</a>
        )}
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow"><span className="status-dot" /> СВЕЖЕЕ ОТ МЕСТНЫХ ФЕРМЕРОВ</span>
            <h1>Настоящие продукты.<br /><em>Честное происхождение.</em></h1>
            <p>Собираем урожай у фермеров и привозим его к вам — без лишнего пути от поля до стола.</p>
            <a className="button button-dark" href="#catalog">Выбрать продукты <span aria-hidden="true">↘</span></a>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="hero-sun" />
            <span className="hero-leaf leaf-one">✳</span>
            <span className="hero-leaf leaf-two">✳</span>
            <div className="hero-sticker"><span>СОБРАНО</span><strong>с заботой</strong><span>в Казахстане</span></div>
            <span className="hero-produce produce-one">🥬</span>
            <span className="hero-produce produce-two">🍅</span>
            <span className="hero-produce produce-three">🥕</span>
          </div>
          <div className="hero-index"><span>01</span> / 03</div>
        </section>

        <section className="benefit-strip" aria-label="Наши принципы">
          <span><b>01</b> Местные производители</span>
          <span><b>02</b> Прозрачные цены</span>
          <span><b>03</b> Бережная доставка</span>
        </section>

        <section className="catalog-section section-wrap" id="catalog">
          <div className="section-heading">
            <div>
              <span className="eyebrow">ВЫБИРАЙТЕ СЕЗОННОЕ</span>
              <h2>Продукты <em>с характером</em></h2>
            </div>
            <label className="search-box">
              <span className="sr-only">Поиск товаров</span>
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти продукт" />
            </label>
          </div>

          {user?.role === 'admin' && (
            <div className="admin-toolbar">
              <div><span className="eyebrow">УПРАВЛЕНИЕ КАТАЛОГОМ</span><p>Создавайте, редактируйте и удаляйте товары.</p></div>
              <button
                className="button button-dark"
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductForm((visible) => !visible);
                }}
              >
                {showProductForm && !editingProduct ? 'Закрыть' : '＋ Добавить товар'}
              </button>
            </div>
          )}
          {showProductForm && user?.role === 'admin' && (
            <AddProductForm
              product={editingProduct}
              onSaved={handleProductSaved}
              onCancel={() => {
                setEditingProduct(null);
                setShowProductForm(false);
              }}
            />
          )}

          {productsError && <p className="notice notice-error" role="alert">{productsError}</p>}
          {!productsError && filteredProducts.length === 0 ? (
            <div className="empty-state">{search ? 'По вашему запросу ничего не найдено.' : 'Каталог пока пуст.'}</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <article className="product-card" key={product.id}>
                  <div className={`product-visual product-visual-${index % 4}`}>
                    <span className="product-number">0{index + 1}</span>
                    <span className="product-emoji" aria-hidden="true">
                      {product.category?.toLowerCase().includes('молоч') ? '🥛'
                        : product.category?.toLowerCase().includes('овощ') ? '🥔'
                          : product.category?.toLowerCase().includes('бакале') ? '🍯' : '🌿'}
                    </span>
                    {product.category && <span className="product-category">{product.category}</span>}
                  </div>
                  <div className="product-details">
                    <div className="product-title-row">
                      <h3>{product.name}</h3>
                      <span className="product-price">{money.format(product.price)} <small>₸/{product.unit}</small></span>
                    </div>
                    <p className="product-description">От проверенных местных производителей</p>
                    {user?.role === 'admin' ? (
                      <div className="card-actions">
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditingProduct(product);
                            setShowProductForm(true);
                            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                        >Изменить</button>
                        <button className="text-button text-danger" onClick={() => handleDeleteProduct(product)}>Удалить</button>
                      </div>
                    ) : (
                      <button
                        className="text-button order-link"
                        onClick={() => setSelectedProduct((current) => current?.id === product.id ? null : product)}
                      >
                        {selectedProduct?.id === product.id ? 'Скрыть форму' : 'Оставить заявку'} <span aria-hidden="true">↗</span>
                      </button>
                    )}
                    {selectedProduct?.id === product.id && user?.role !== 'admin' && (
                      <OrderForm
                        product={product}
                        user={user}
                        onSubmitted={() => {
                          setSelectedProduct(null);
                          setOrdersVersion((version) => version + 1);
                          setNotice('Заявка отправлена. Спасибо!');
                        }}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="catalog-footnote"><span>✳</span> Каждый продукт начинается с хорошей земли и заботливых рук.</div>
        </section>

        {!user && !checkingSession && (
          <section className="account-section section-wrap" id="login">
            <div className="account-intro">
              <span className="eyebrow">РАДЫ ВАС ВИДЕТЬ</span>
              <h2>Войдите,<br /><em>чтобы быть ближе</em></h2>
              <p>Создайте аккаунт покупателя, чтобы следить за своими заявками и управлять профилем.</p>
            </div>
            <LoginForm onLogin={handleLogin} />
          </section>
        )}

        {user && user.role !== 'admin' && (
          <section className="account-section section-wrap" id="my-orders">
            <div className="account-intro">
              <span className="eyebrow">ВАШ ПРОФИЛЬ</span>
              <h2>Всё важное<br /><em>в одном месте</em></h2>
              <p>Заявки, отправленные во время входа в аккаунт, сохраняются здесь.</p>
              <ChangePasswordForm />
            </div>
            <MyOrders refreshKey={ordersVersion} />
          </section>
        )}

        {user?.role === 'admin' && (
          <>
          <section className="section-wrap account-section admin-account-section">
            <div className="account-intro">
              <span className="eyebrow">БЕЗОПАСНОСТЬ</span>
              <h2>Настройки<br /><em>аккаунта</em></h2>
              <p>Управляйте паролем администратора.</p>
            </div>
            <ChangePasswordForm />
          </section>
          <section className="orders-section section-wrap" id="orders">
            <div className="section-heading">
              <div><span className="eyebrow">ТОЛЬКО ДЛЯ АДМИНИСТРАТОРА</span><h2>Заявки <em>покупателей</em></h2></div>
              <button className="button button-outline" onClick={() => setOrdersVersion((version) => version + 1)}>Обновить список</button>
            </div>
            <OrdersPanel refreshKey={ordersVersion} />
          </section>
          </>
        )}

        {notice && (
          <div className="toast" role="status">
            <span>{notice}</span>
            <button aria-label="Закрыть уведомление" onClick={() => setNotice('')}>×</button>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand brand-footer" href="#top"><span className="brand-mark">А</span><span><strong>АгроМаркет</strong><small>вкус рядом</small></span></a>
        <span>Хорошие продукты начинаются с доверия.</span>
        <span>© {new Date().getFullYear()} АгроМаркет</span>
      </footer>
    </div>
  );
}

export default App;
