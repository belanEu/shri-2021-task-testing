import { Order, Product, ProductShortInfo } from './../../src/common/types';

export const getProductsShortInfoStub = (amount: number): ProductShortInfo[] => {
    const products = [];
    for (let i = 0; i < amount; i++) {
        let productInfo = {
            id: i,
            name: 'blabla',
            price: 12,
        };

        products.push(productInfo);
    }

    return products;
}



export const getProductStub = (id: number): Product => {
    return {
        id: id,
        name: 'blabla',
        price: 12,
        description: 'blablablablabla',
        material: 'lala',
        color: 'blue'
    };
};

export const OrderStub: Order = {
    form: {
        name: "Bla-Bla",
        phone: "113343232432423",
        address: "asadfs"
    },
    cart: {
        1: {
            name: 'name',
            price: 10,
            count: 1
        }
    }
};

export const ProductShortInfoStub: ProductShortInfo = {
    id: 1,
    name: 'blabla',
    price: 12
};

export const ProductStub: Product = {
    id: 1,
    name: 'blabla',
    price: 12,
    description: 'blablablablabla',
    material: 'lala',
    color: 'blue'
};