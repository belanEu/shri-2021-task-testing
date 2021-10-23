/**
 * @jest-environment jsdom
 */
import React from 'react'
import { Router } from "react-router";
import { Provider } from "react-redux";
import { createMemoryHistory } from 'history';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom'

import { Application } from '../../../src/client/Application';
import { initStore } from "../../../src/client/store";
import { CartApi, ExampleApi } from "../../../src/client/api";

describe('проверка навигации', () => {
    test('переход по ссылкам в шапке', () => {
        const history = createMemoryHistory({
            initialEntries: ['/'],
            initialIndex: 0
        });
        const store = initStore(new ExampleApi('/hw/store'), new CartApi);
        const app = (
            <Router history={history}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </Router>
        );
        const leftClick = {button: 0};

        render(app);

        // главная
        expect(screen.getByText(/Welcome to Example store/i)).toBeInTheDocument();

        let navLinks = [
            {linkName: /catalog/i, heading: /Catalog/i},
            {linkName: /delivery/i, heading: /Delivery/i},
            {linkName: /contacts/i, heading: /Contacts/i},
            {linkName: /cart/i, heading: /Shopping cart/i},
        ];

        // проход по навигационным ссылкам в шапке
        navLinks.forEach(item => {
            userEvent.click(screen.getByRole('link', {name: item.linkName}), leftClick);
            expect(screen.getByRole('heading', {name: item.heading})).toBeInTheDocument();    
        });

        // обратно на главную
        userEvent.click(screen.getByRole('link', {name: /example store/i}), leftClick);
        expect(screen.getByText(/Welcome to Example store/i)).toBeInTheDocument();
    });
});