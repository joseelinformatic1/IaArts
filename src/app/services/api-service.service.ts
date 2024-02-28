import { Injectable } from '@angular/core';
import { IArtwork } from '../interfaces/i-artwork';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject, from, map, mergeMap, toArray, tap } from 'rxjs';
import { createClient } from '@supabase/supabase-js'
import { environment } from '../../environments/environment';


const url = `https://api.artic.edu/api/v1/artworks`;

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  supaClient: any = null;
  artworksSubject: Subject<IArtwork[]> = new Subject();

  constructor(private http: HttpClient) {
    this.supaClient = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  public getArtWorks(): Observable<IArtwork[]> {
    this.http.get<{ data: IArtwork[] }>(url).pipe(
      map(response => response.data)
    ).subscribe((artworks) => {
        this.artworksSubject.next(artworks);
    }
    );
    return this.artworksSubject;
  }
  
  public async getFavoriteArtworks(uid: string): Promise<string[]> {
    try {
      const { data: user, error } = await this.supaClient
        .from('users')
        .select('favorite_paintings')
        .eq('id', uid)
        .single();

      if (error) {
        throw error;
      }

      if (user) {
        return user.favorite_paintings || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching favorite artworks:', error);
      return [];
    }
  }

  public filterArtWorks(filter:string): void{
    this.http.get<{ data: IArtwork[] }>(`${url}/search?q=${filter}&fields=id,description,title,image_id`).pipe(
      map(response => response.data)
    ).subscribe((artworks) => {
        this.artworksSubject.next(artworks);
    }
    );
  }

  public getArtworksFromIDs(artworkList: string[]): Observable<IArtwork[]>{

    from(artworkList).pipe(
      mergeMap(artwork_id =>{
        return  this.http.get<{ data: IArtwork[] }>(`${url}/${artwork_id}`).pipe(
          map(response => response.data)
        )
      }),
      toArray()
    ).subscribe(artworks => this.artworksSubject.next(artworks.flat()))

    return this.artworksSubject;
  }

  public fetchArtworksPage(page: number): Observable<IArtwork[]> {
      const constructedUrl = `${url}?page=${page}`;
      
      return this.http.get<{ data: IArtwork[] }>(constructedUrl).pipe(
          map(response => response.data),
          tap(artworks => this.artworksSubject.next(artworks))
      );
  }
}
