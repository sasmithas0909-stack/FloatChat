import React from 'react';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { mockUser } from 'mocks/mockUser';

// Mock IntersectionObserver for Framer Motion viewport anims in JSDOM
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null
});
window.IntersectionObserver = mockIntersectionObserver;

import Contact from '.';

vi.mock('common/NavBar', () => ({ default: 'Mock-NavBar' }));

const mockStore = configureStore([]);
const theme = createTheme();

describe('Contact', () => {
  let element: HTMLElement;
  beforeEach(() => {
    const store = mockStore({
      user: {
        userInfo: mockUser,
        loading: false,
        error: null,
      },
    });

    store.dispatch = vi.fn();

    element = render(
      <Provider store={store}>
        <Router>
          <ThemeProvider theme={theme}>
            <Contact />
          </ThemeProvider>
        </Router>
      </Provider>,
    ).container;
  });

  it('should render with given state from Redux store', () => {
    expect(element).toMatchSnapshot();
  });
});
