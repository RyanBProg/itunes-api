export class ArtistDto {
  id!: number;
  name!: string;
  genre?: string;
}

export class ArtistsTodayResponseDto {
  data!: ArtistDto[];
  meta!: {
    total: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
  };
}
