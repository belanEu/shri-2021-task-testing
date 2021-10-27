/**
 * @jest-environment jsdom
 */
import React from 'react'
import { Provider } from "react-redux";
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { render, waitFor, within, screen } from '@testing-library/react';
import '@testing-library/jest-dom'
 
import { initStore, addToCart } from "../../../src/client/store";
import { CartApi } from '../../../src/client/api';
import { ExampleApiMock } from "../../helper/Mocks";
import { Catalog } from '../../../src/client/pages/Catalog';
import { Application } from '../../../src/client/Application';
import userEvent from '@testing-library/user-event';
import { getProductStub } from '../../helper/Stubs';

describe('проверка страницы Catalog', () => {
    const AMOUNT_OF_PRODUCTS = 5;

    describe('компонент Catalog', () => {
        const exampleApiMock = new ExampleApiMock(AMOUNT_OF_PRODUCTS);
        let history = createMemoryHistory({
            initialEntries: ['/catalog'],
            initialIndex: 0
        });
        let store = initStore(exampleApiMock, new CartApi);

        const catalog = (
            <Router history={history}>
                <Provider store={store}>
                    <Catalog />
                </Provider>
            </Router>
        );

        test('загрузка списка товаров', () => {
            const {getByText} = render(catalog);
            expect(getByText(/loading/i)).toBeInTheDocument();
        });
    
        test('наличие всех полученных товаров на странице', async () => {
            const {getByText, queryAllByTestId} = render(catalog);
            await waitFor(() => !getByText(/loading/i));
            
            expect(store.getState().products).toBeDefined();
            
            expect(
                store.getState().products.every(product => {
                    const elements = queryAllByTestId(product.id.toString());
                    if (elements.length > 0) {
                        return elements[0].hasChildNodes() ?
                            elements[0].firstElementChild === elements[1] : false;
                    } else {
                        return false;
                    }
                })
            ).toBeTruthy();
        });
    
        test('наличие названия, цены и ссылки для каждого товара', async () => {
            const {getByText, queryAllByTestId} = render(catalog);
            await waitFor(() => !getByText(/loading/i));
            
            expect(store.getState().products).toBeDefined();
    
            expect(
                store.getState().products.every(product => {
                    const productElement = queryAllByTestId(product.id.toString())[1];
                    return within(productElement).getByRole('heading', {name: product.name, level: 5})
                        && within(productElement).getByText(`$${product.price}`)
                        && within(productElement).getByRole('link', {name: /Details/i});
                })
            ).toBeTruthy();
        });
    });

    describe('страница Catalog', () => {
        const exampleApiMock = new ExampleApiMock(AMOUNT_OF_PRODUCTS);
        let history = createMemoryHistory({
            initialEntries: ['/catalog'],
            initialIndex: 0
        });
        let store = initStore(new ExampleApiMock(AMOUNT_OF_PRODUCTS), new CartApi);

        beforeEach(async () => {
            history = createMemoryHistory({
                initialEntries: ['/catalog'],
                initialIndex: 0
            });
            store = initStore(new ExampleApiMock(AMOUNT_OF_PRODUCTS), new CartApi);
            render((
                <Router history={history}>
                    <Provider store={store}>
                        <Application />
                    </Provider>
                </Router>
            ));

            await waitFor(() => store.subscribe);
        });

        test('переход к деталям товара. загрузка данных о товаре', async () => {
            expect(store.getState().products).toBeDefined();

            const leftClick = {button: 0};

            let productElement = screen.queryAllByTestId(store.getState().products[0].id.toString())[1];

            userEvent.click(within(productElement).getByRole('link', {name: /Details/i}), leftClick);

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        test('переход к деталям каждого товара. данные о товаре', async () => {
            expect(store.getState().products).toBeDefined();

            const leftClick = {button: 0};
            
            let product = getProductStub(store.getState().products[0].id);
            let productElement = screen.queryAllByTestId(product.id.toString())[1];

            userEvent.click(within(productElement).getByRole('link', {name: /Details/i}), leftClick);

            await waitFor(() => store.subscribe);
            
            expect(screen.getByRole('heading', {name: product.name})).toBeInTheDocument();
            expect(screen.getByText(product.description)).toBeInTheDocument();
            expect(screen.getByText(`$${product.price}`)).toBeInTheDocument();
            expect(screen.getByText(product.material)).toBeInTheDocument();
            expect(screen.getByText(product.color)).toBeInTheDocument();
        });


        describe('связь с корзиной', () => {
            test('отображение в каталоге и на странице товара сообщения о том, что товар добавлен', async () => {    
                await waitFor(() => store.subscribe);

                const leftClick = {button: 0};

                let product = getProductStub(0);
                store.dispatch(addToCart(product));
                let productElement = screen.queryAllByTestId(product.id.toString())[1];
                expect(within(productElement).getByText(/Item in cart/i)).toBeInTheDocument();

                await waitFor(() => userEvent.click(within(productElement).getByRole('link', {name: /Details/i}), leftClick));

                expect(screen.getByText(/Item in cart/i)).toBeInTheDocument();
                
            });


            test('повторное нажатие на кнопку Add to Cart должно увеличивать число товара', async () => {    
                await waitFor(() => store.subscribe);

                const leftClick = {button: 0};

                let product = getProductStub(store.getState().products[0].id);
                let productElement = screen.queryAllByTestId(product.id.toString())[1];
                let addCount = store.getState().cart[product.id].count;

                userEvent.click(within(productElement).getByRole('link', {name: /Details/i}), leftClick);
                
                await waitFor(() => !screen.getByText(/loading/i));

                userEvent.click(screen.getByRole('button', {name: /Add to Cart/i}), leftClick);
                expect(store.getState().cart[product.id].count).toEqual(++addCount);
                userEvent.click(screen.getByRole('button', {name: /Add to Cart/i}), leftClick);
                expect(store.getState().cart[product.id].count).toEqual(++addCount);
            });


            test('содержимое корзины сохраняется при перезагрузке страницы', async () => {    
                await waitFor(() => store.subscribe);

                const cart = store.getState().cart[0];
                history.go(0);
                expect(store.getState().cart[0]).toEqual(cart);
            });
        });
    });
});