import AlpacaClient from '@alpacahq/alpaca-trade-api';

export interface AlpacaMarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface AlpacaPosition {
  symbol: string;
  qty: number;
  avg_entry_price: number;
  current_price: number;
  market_value: number;
  unrealized_pl: number;
  unrealized_plpc: number;
}

export interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  time_in_force: string;
  status: string;
  filled_at?: string;
  filled_qty?: number;
  filled_avg_price?: number;
}

export interface AlpacaAccount {
  id: string;
  status: string;
  currency: string;
  buying_power: number;
  cash: number;
  portfolio_value: number;
  daytrade_count: number;
}

export class AlpacaService {
  private client: AlpacaClient;

  constructor() {
    const apiKey = process.env.ALPACA_API_KEY;
    const secretKey = process.env.ALPACA_SECRET_KEY;
    const baseUrl = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

    if (!apiKey || !secretKey) {
      throw new Error('Alpaca API credentials not configured. Please set ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables.');
    }

    this.client = new AlpacaClient({
      keyId: apiKey,
      secretKey: secretKey,
      paper: baseUrl.includes('paper'),
      baseUrl: baseUrl
    });
  }

  async getMarketData(symbols: string[]): Promise<AlpacaMarketData[]> {
    try {
      const bars = await this.client.getLatestBars(symbols);

      return symbols.map(symbol => {
        const bar = bars.get(symbol);
        if (!bar) {
          throw new Error(`No market data available for ${symbol}`);
        }

        const change = bar.ClosePrice - bar.OpenPrice;
        const changePercent = (change / bar.OpenPrice) * 100;

        return {
          symbol,
          price: bar.ClosePrice,
          volume: bar.Volume,
          change,
          changePercent,
          high: bar.HighPrice,
          low: bar.LowPrice,
          open: bar.OpenPrice,
          previousClose: bar.OpenPrice, // This should be previous day's close
          timestamp: new Date(bar.Timestamp)
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch market data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getHistoricalBars(symbol: string, start: Date, end: Date, timeframe: string = '1Day'): Promise<any[]> {
    try {
      const bars = await this.client.getBarsV2(symbol, {
        start: start.toISOString(),
        end: end.toISOString(),
        timeframe: timeframe,
        adjustment: 'raw'
      });

      const result = [];
      for await (const bar of bars) {
        result.push({
          timestamp: new Date(bar.Timestamp),
          open: bar.OpenPrice,
          high: bar.HighPrice,
          low: bar.LowPrice,
          close: bar.ClosePrice,
          volume: bar.Volume
        });
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to fetch historical bars for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async placeOrder(orderRequest: {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    time_in_force?: string;
    limit_price?: number;
  }): Promise<AlpacaOrder> {
    try {
      const order = await this.client.createOrder({
        symbol: orderRequest.symbol,
        qty: orderRequest.qty,
        side: orderRequest.side,
        type: orderRequest.type,
        time_in_force: orderRequest.time_in_force || 'gtc',
        ...(orderRequest.limit_price && { limit_price: orderRequest.limit_price })
      });

      return {
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.type,
        time_in_force: order.time_in_force,
        status: order.status,
        filled_at: order.filled_at,
        filled_qty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined
      };
    } catch (error) {
      throw new Error(`Failed to place order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getAccount(): Promise<AlpacaAccount> {
    try {
      const account = await this.client.getAccount();

      return {
        id: account.id,
        status: account.status,
        currency: account.currency,
        buying_power: parseFloat(account.buying_power),
        cash: parseFloat(account.cash),
        portfolio_value: parseFloat(account.portfolio_value),
        daytrade_count: parseInt(account.daytrade_count)
      };
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPositions(): Promise<AlpacaPosition[]> {
    try {
      const positions = await this.client.getPositions();

      return positions.map((pos: any) => ({
        symbol: pos.symbol,
        qty: parseFloat(pos.qty),
        avg_entry_price: parseFloat(pos.avg_entry_price),
        current_price: parseFloat(pos.current_price),
        market_value: parseFloat(pos.market_value),
        unrealized_pl: parseFloat(pos.unrealized_pl),
        unrealized_plpc: parseFloat(pos.unrealized_plpc)
      }));
    } catch (error) {
      throw new Error(`Failed to get positions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPosition(symbol: string): Promise<AlpacaPosition | null> {
    try {
      const position = await this.client.getPosition(symbol);

      return {
        symbol: position.symbol,
        qty: parseFloat(position.qty),
        avg_entry_price: parseFloat(position.avg_entry_price),
        current_price: parseFloat(position.current_price),
        market_value: parseFloat(position.market_value),
        unrealized_pl: parseFloat(position.unrealized_pl),
        unrealized_plpc: parseFloat(position.unrealized_plpc)
      };
    } catch (error) {
      if ((error as any).status === 404) {
        return null; // Position doesn't exist
      }
      throw new Error(`Failed to get position for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async closePosition(symbol: string): Promise<AlpacaOrder> {
    try {
      const order = await this.client.closePosition(symbol);

      return {
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.type,
        time_in_force: order.time_in_force,
        status: order.status
      };
    } catch (error) {
      throw new Error(`Failed to close position for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getOrders(status?: string): Promise<AlpacaOrder[]> {
    try {
      const orders = await this.client.getOrders();

      return orders.map((order: any) => ({
        id: order.id,
        symbol: order.symbol,
        qty: parseFloat(order.qty),
        side: order.side,
        type: order.type,
        time_in_force: order.time_in_force,
        status: order.status,
        filled_at: order.filled_at,
        filled_qty: order.filled_qty ? parseFloat(order.filled_qty) : undefined,
        filled_avg_price: order.filled_avg_price ? parseFloat(order.filled_avg_price) : undefined
      }));
    } catch (error: any) {
      throw new Error(`Failed to get orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const alpacaService = new AlpacaService();
