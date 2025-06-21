// import { Process, Processor } from '@nestjs/bull';
// import { Job } from 'bull';
// import { AuctionService } from './auction.service';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';
// import { Cron } from '@nestjs/schedule';

// @Processor('auction')
// export class AuctionProcessor {
//   constructor(
//     private readonly auctionSvc: AuctionService,
//     @InjectQueue('auction') private readonly queue: Queue,
//   ) {}

//   @Cron('* * * * *')
//   async findExpiring() {
//     const expiring = await this.auctionSvc.findExpiringSoon(60);
//     expiring.forEach(a =>
//       this.queue.add('close', { auctionId: a.id }, { delay: 60_000 }),
//     );
//   }

//   @Process('close')
//   async handleClose(job: Job<{ auctionId: number }>) {
//     await this.auctionSvc.close(job.data.auctionId);
//   }
// }
