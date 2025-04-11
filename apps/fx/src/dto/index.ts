import { IsNotEmpty, IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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