import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ListingService } from './listing.service';
import { Request } from 'express';
import { Roles } from 'src/auth/roles.guard';
import { RolesGuard } from 'src/auth/roles.guard';

// Basic DTO for validation - we can enhance this later
export class CreateListingDto {
  name: string;
  year: number;
  player: string;
  grade?: string;
  serial?: string;
  type: 'FIXED_PRICE' | 'AUCTION';
  price: number;
  endDate: string; // Will be a date string
  imageUrl: string;
  thumbUrl: string;
}

@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('SELLER')
  create(@Body() createListingDto: CreateListingDto, @Req() req: Request) {
    // In a real app, you'd get the userId from a proper auth guard/decorator
    const sellerId = req.headers['authorization']?.split(' ')[1];
    if (!sellerId) {
      throw new Error('Unauthorized'); // Proper error handling needed
    }
    return this.listingService.create(createListingDto, sellerId);
  }
}
