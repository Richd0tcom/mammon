// fx.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly supportedCurrencies = ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY'];
  private readonly cacheExpiryTimeMs = 5 * 60 * 1000; // 5 minutes
  private readonly ratesCache = new Map<string, { rate: number; timestamp: number }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // Initialize rates on service start
    this.updateAllRates();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateAllRates() {
    try {
      this.logger.log('Updating all exchange rates');
      
      // For each supported currency pair, update the rate
      for (const baseCurrency of this.supportedCurrencies) {
        for (const targetCurrency of this.supportedCurrencies) {
          if (baseCurrency !== targetCurrency) {
            await this.fetchExchangeRate(baseCurrency, targetCurrency);
          }
        }
      }
      
      this.logger.log('All exchange rates updated successfully');
    } catch (error) {
      this.logger.error(`Error updating exchange rates: ${error.message}`);
    }
  }

  // async getAllRates(): Promise<any[]> {

  // }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    const cacheKey = `${fromCurrency}-${toCurrency}`;
    
    // Check cache first
    const cachedRate = this.ratesCache.get(cacheKey);
    if (cachedRate && Date.now() - cachedRate.timestamp < this.cacheExpiryTimeMs) {
      return cachedRate.rate;
    }
    
    // If not found or expired, fetch from API
    return this.fetchExchangeRate(fromCurrency, toCurrency);
  }

  async fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      // Replace with actual API call to external FX rate provider
      const apiKey = this.configService.get<string>('FX_API_KEY');
      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${fromCurrency}`;
      
      const { data } = await firstValueFrom(
        this.httpService.get(url).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Error fetching exchange rate: ${error.message}`);
            throw new NotFoundException('Exchange rate service unavailable');
          }),
        ),
      );
      
      // Extract the exchange rate for the target currency
      if (!data.conversion_rates || !data.conversion_rates[toCurrency]) {
        throw new NotFoundException(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
      }
      
      const rate = data.conversion_rates[toCurrency];
      
      
      // Update cache
      this.ratesCache.set(`${fromCurrency}-${toCurrency}`, {
        rate,
        timestamp: Date.now(),
      });
      
      return rate;
    } catch (error) {
      
      this.logger.warn(`Using fallback rate for ${fromCurrency} to ${toCurrency}`);
      
      // If all else fails, use a fixed emergency rate
      // In a real system, you would have better fallback mechanisms
      if (fromCurrency === 'NGN' && toCurrency === 'USD') {
        return 0.00074; // Approx NGN to USD
      } else if (fromCurrency === 'USD' && toCurrency === 'NGN') {
        return 1350; // Approx USD to NGN
      }
      
      throw new NotFoundException(`Could not determine exchange rate for ${fromCurrency} to ${toCurrency}`);
    }
  }

  async convertAmount(
    fromCurrency: string,
    toCurrency: string,
    amount: number,
  ): Promise<{ convertedAmount: number; rate: number }> {

    //use external api for conversion
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = amount * rate;
    
    return {
      convertedAmount,
      rate,
    };
  }
}
