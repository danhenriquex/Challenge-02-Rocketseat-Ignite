import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface StockInfo {
  id: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [stock, setStock] = useState<StockInfo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  useEffect(() => {
    async function loadStock() {
      api.get("/stock").then((response) => {
        if (response.status === 200) {
          setStock(response.data);
        }
      });
    }

    loadStock();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      api.get("/products").then((response) => {
        if (response.status === 200) {
          setProducts(response.data);
        }
      });
    }
    loadProducts();
  }, []);

  const addProduct = async (productId: number) => {
    try {
      // TODO

      const productOnLocalStorage = cart.filter(
        (item) => item.id === productId
      );
      const productInStock = stock.filter((item) => item.id === productId);
      const productToAdd = products.filter((item) => item.id === productId);

      if (productOnLocalStorage.length) {
        if (productOnLocalStorage[0].amount + 1 > productInStock[0].amount) {
          throw new Error();
        }

        const newCart = cart.map((item) =>
          item.id === productId ? { ...item, amount: item.amount + 1 } : item
        );

        setCart(newCart);

        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));

        return;
      }

      const newObj = {
        amount: 1,
        id: productToAdd[0].id,
        image: productToAdd[0].image,
        title: productToAdd[0].title,
        price: productToAdd[0].price,
      };

      setCart([...cart, newObj]);

      cart.push(newObj);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    } catch (err) {
      // TODO
      console.error(err);

      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter((item) => item.id !== productId);

      setCart(newCart);

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const productInStock = stock.filter((item) => item.id === productId);

      if (amount <= 0) return;

      if (amount > productInStock[0].amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updateCart = cart.map((item) =>
        item.id === productId ? { ...item, amount } : item
      );

      setCart(updateCart);
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCart));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
