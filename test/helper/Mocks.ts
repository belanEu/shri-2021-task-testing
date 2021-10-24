import { AxiosResponse } from "axios";
import { ExampleApi, CartApi } from "../../src/client/api";
import { ProductShortInfo, Product, CheckoutFormData, CartState, CheckoutResponse } from "../../src/common/types";
import { getProductStub, getProductsShortInfoStub, OrderStub } from "./Stubs";

export class ExampleApiMock extends ExampleApi {
    shortInfoProducts: ProductShortInfo[];

    constructor(amountOfProducts: number) {
        super('/');
        this.shortInfoProducts = getProductsShortInfoStub(amountOfProducts);
    }

    async getProducts() {
        return {data: this.shortInfoProducts} as AxiosResponse<ProductShortInfo[]>;
    }

    async getProductById(id: number) {
        return {data: getProductStub(id)} as AxiosResponse<Product>;
    }

    async checkout(form: CheckoutFormData, cart: CartState) {
        return {data: {id: 3}} as AxiosResponse<CheckoutResponse>;
    }
}