import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from "class-validator";

export class CreateWalletDto {}


export class TradeDto {
    @ApiProperty({ example: 'NGN' })
    @IsString()
    @IsNotEmpty()
    fromCurrency: string;
  
    @ApiProperty({ example: 'USD' })
    @IsString()
    @IsNotEmpty()
    toCurrency: string;
  
    @ApiProperty({ example: 10000 })
    @IsNumber()
    @Min(0.01)
    amount: number;
  
    @ApiPropertyOptional({ example: 'TRADE_REF_123' })
    @IsString()
    @IsOptional()
    reference?: string;
  }


  export class ConvertCurrencyDto {
    @ApiProperty({ example: 'NGN' })
    @IsString()
    @IsNotEmpty()
    fromCurrency: string;
  
    @ApiProperty({ example: 'USD' })
    @IsString()
    @IsNotEmpty()
    toCurrency: string;
  
    @ApiProperty({ example: 10000 })
    @IsNumber()
    @Min(0.01)
    amount: number;
  
    @ApiPropertyOptional({ example: 'CONV_REF_123' })
    @IsString()
    @IsOptional()
    reference?: string;
  }
  


  export class FundWalletDto {
    @ApiProperty({ example: 'NGN' })
    @IsString()
    @IsNotEmpty()
    currency: string;
  
    @ApiProperty({ example: 10000 })
    @IsNumber()
    @Min(0.01)
    amount: number;
  
    @ApiPropertyOptional({ example: 'PAYMENT_REF_123' })
    @IsString()
    @IsOptional()
    reference?: string;
  
    @ApiPropertyOptional({ example: 'bank_transfer' })
    @IsString()
    @IsOptional()
    fundingMethod?: string;
  
    @ApiPropertyOptional({ example: 'Initial funding' })
    @IsString()
    @IsOptional()
    notes?: string;
  }