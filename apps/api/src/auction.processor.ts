@Processor('auction')
export class AuctionProcessor {
  constructor(
    private readonly auctionSvc: AuctionService,
    @InjectQueue('auction') private readonly queue: Queue,
  ) {}

  // cron: runs every minute
  @Cron('* * * * *')
  async checkExpiring() {
    const expiring = await this.auctionSvc.findExpiringWithin(60)
    expiring.forEach(a =>
      this.queue.add('close', { auctionId: a.id }, { jobId: `close:${a.id}` }),
    )
  }

  @Process('close')
  async handleClose(job: Job<{ auctionId: number }>) {
    await this.auctionSvc.closeAuction(job.data.auctionId)
  }
}
