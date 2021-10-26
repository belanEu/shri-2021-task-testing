/**
 * @jest-environment jsdom
 */
 import React from 'react'
 import { Provider } from "react-redux";
 import { Router } from 'react-router';
 import { createMemoryHistory } from 'history';
 import { render, within, screen } from '@testing-library/react';
 import '@testing-library/jest-dom'
 
 import { initStore, addToCart } from "../../../src/client/store";
 import { ExampleApiMock, CartApiMock } from "../../helper/Mocks";
import { Application } from '../../../src/client/Application';
import userEvent from '@testing-library/user-event';
import { getProductStub } from '../../helper/Stubs';
import {CartItem} from '../../../src/common/types';
import { Cart } from '../../../src/client/pages/Cart';

describe('проверка страницы Shopping cart', () => {
    const AMOUNT_OF_PRODUCTS = 5;
    let history = createMemoryHistory({
        initialEntries: ['/cart'],
        initialIndex: 0
    });
    let store = initStore(new ExampleApiMock(AMOUNT_OF_PRODUCTS), new CartApiMock);

    test('кол-во неповторяющихся товаров в шапке рядом со ссылкой на корзину', () => {
        render((
            <Router history={history}>
                <Provider store={store}>
                    <Application />
                </Provider>
            </Router>
        ));

        // трижды добавляется первый товар
        store.dispatch(addToCart(getProductStub(0)));
        store.dispatch(addToCart(getProductStub(0)));
        store.dispatch(addToCart(getProductStub(0)));

        // дважды добавляется второй товар
        store.dispatch(addToCart(getProductStub(1)));
        store.dispatch(addToCart(getProductStub(1)));

        const amountOfChosenProducts = Object.keys(store.getState().cart).length;
        expect(amountOfChosenProducts).toEqual(2);
        expect(screen.getByRole('link', {name: `Cart (${amountOfChosenProducts.toString()})`})).toBeInTheDocument();
    });

    describe('проверка компонента Cart', () => {
        beforeEach(() => {
            history = createMemoryHistory({
                initialEntries: ['/cart'],
                initialIndex: 0
            });
            store = initStore(new ExampleApiMock(AMOUNT_OF_PRODUCTS), new CartApiMock);
            
            render((
                <Router history={history}>
                    <Provider store={store}>
                        <Cart />
                    </Provider>
                </Router>
            ));
        });

        test('отображена таблица с выбранными продуктами', () => {
            expect(store.getState().cart).toBeDefined();
    
            expect(
                Object.keys(store.getState().cart).every(id => {
                    const productData: CartItem = store.getState().cart[+id];
                    const tableItem = screen.getByTestId(id);
    
                    return within(tableItem).queryAllByText(productData.name).length > 0
                        && within(tableItem).queryAllByText(productData.count).length > 0
                        && within(tableItem).queryAllByText(`$${productData.price}`).length > 0
                        && within(tableItem).queryAllByText(`$${productData.count * productData.price}`).length > 0;
                })
            ).toBeTruthy();
    
            const totalPrice = Object.values(store.getState().cart)
                .reduce((sum, { count, price }) => sum + count * price, 0);
            expect(screen.queryByText(`$${totalPrice}`)).toBeInTheDocument();
        });
    
        test('очистка корзины по нажатию на Clear shopping cart', () => {
            const clearButton = screen.getByRole('button', {name: /Clear shopping cart/i});
            expect(clearButton).toBeInTheDocument();
    
            const leftClick = {button: 0};
    
            userEvent.click(clearButton, leftClick);
    
            expect(Object.keys(store.getState().cart).length).toEqual(0);
        });
    
        test('пустая корзина. есть ссылка на каталог', () => {    
            expect(screen.queryByText(/Cart is empty. Please select products in the/i)).toBeInTheDocument();
            expect(screen.queryByRole('link', {name: /catalog/i})).toBeInTheDocument();
            
            const product = getProductStub(0);
            expect(screen.queryAllByText(product.name).length > 0).toBeFalsy();
        });

        test.only('проверка Checkout', () => {
            const product = getProductStub(0);
            store.dispatch(addToCart(product));
            expect(screen.queryByText(/Please provide your name/i)).toBeInTheDocument();
            expect(screen.queryByText(/Please provide a valid phone/i)).toBeInTheDocument();
            expect(screen.queryByText(/Please provide a valid address/i)).toBeInTheDocument();
        });
    });
});