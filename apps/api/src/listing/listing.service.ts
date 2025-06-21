import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateListingDto } from './listing.controller';

@Injectable()
export class ListingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createListingDto: CreateListingDto, sellerId: string) {
    const {
      name,
      year,
      player,
      grade,
      serial,
      type,
      price,
      endDate,
      imageUrl,
      thumbUrl,
    } = createListingDto;

    return this.prisma.listing.create({
      data: {
        seller: { connect: { clerkId: sellerId } },
        type,
        price,
        startDate: new Date(),
        endDate: new Date(endDate),
        status: 'ACTIVE',
        card: {
          create: {
            owner: { connect: { clerkId: sellerId } },
            name,
            year,
            player,
            grade,
            serial,
            imageUrl: thumbUrl,
          },
        },
      },
      include: {
        card: true, // Include the created card in the response
      },
    });
  }
}
