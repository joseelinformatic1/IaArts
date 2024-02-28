import { Component, Input, OnInit } from '@angular/core';
import { IArtwork } from '../../interfaces/i-artwork';
import { ArtworkComponent } from '../artwork/artwork.component';
import { ArtworkRowComponent } from '../artwork-row/artwork-row.component';
import { ApiServiceService } from '../../services/api-service.service';
import { ArtworkFilterPipe } from '../../pipes/artwork-filter.pipe';
import { FilterService } from '../../services/filter.service';
import { debounceTime, filter } from 'rxjs';
import { UsersService } from '../../services/users.service';
import { PaginationComponent } from '../pagination/pagination.component';
import { NavigationEnd, Router } from '@angular/router';
import { PaginatonService } from '../../services/paginaton.service';


@Component({
  selector: 'app-artwork-list',
  standalone: true,
  imports: [ArtworkComponent,
    ArtworkRowComponent,
    ArtworkFilterPipe,
    PaginationComponent
  ],
  templateUrl: './artwork-list.component.html',
  styleUrl: './artwork-list.component.css'
})
export class ArtworkListComponent implements OnInit {

  constructor(private artService: ApiServiceService,
    private filterService: FilterService,
    private usersService: UsersService,
    private router: Router,
    private paginationService: PaginatonService
  ) {
  }
  
  quadres: IArtwork[] = [];
  filter: string = '';
  @Input() onlyFavorites: string = '';
  pagedItems:IArtwork[]=[];
  currentPage!:number;

  async ngOnInit(): Promise<void> {
    this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (this.currentPage !== this.paginationService.currentPageNumber()) {
              this.currentPage = this.paginationService.currentPageNumber();
          }
      
          const pageRegex = /\/artwork\/page\/\d+/;
          const isPageMatch = event.url.match(pageRegex);
      
          if (isPageMatch) {
              this.nextPage();
          } else {
              this.paginationService.updateCurrentPage(1);
          }
      }
    });

    if (this.onlyFavorites != 'favorites') {
      this.usersService.getCurrentUserId().then(userId => {
        if (userId) {
          this.artService.getFavoriteArtworks(userId).then((favoriteIds: string[]) => {
              this.artService.getArtWorks().subscribe((artworkList: IArtwork[]) => {
                  this.quadres = artworkList.map(artwork => {
                      if (favoriteIds.includes(artwork.id.toString())) {
                          artwork.like = true;
                      }
                      return artwork;
                  });
              });
          }).catch(error => {
              console.error('Error fetching favorite artworks:', error);
          });
      } else {
          this.quadres = [];
      }
    }).catch(error => {
        console.log("No Logeado");
        this.artService.getArtWorks().pipe(
          )
            .subscribe((artworkList: IArtwork[]) => {this.quadres = 
              artworkList.map(artwork => {
                artwork.like = false;
                return artwork;
            });    
        });  
    });
    }else {
      this.usersService.getCurrentUserId().then(userId => {
        if (userId) {
            this.artService.getFavoriteArtworks(userId).then((favoriteIds: string[]) => {
                this.artService.getArtWorks().subscribe((artworkList: IArtwork[]) => {
                    this.quadres = artworkList.filter(artwork => favoriteIds.includes(artwork.id.toString()));
                    
                    this.quadres.forEach(artwork => {
                        artwork.like = true; 
                    });
                });
            }).catch(error => {
                console.error('Error fetching favorite artworks:', error);
            });
        } else {
            this.quadres = [];
        }
    }).catch(error => {
        console.error('Error fetching user ID:', error);
    });
    }
    this.filterService.searchFilter.pipe(
      //filter(f=> f.length> 4 || f.length ===0),
      debounceTime(500)
    ).subscribe(filter => this.artService.filterArtWorks(filter));

  }

  async toggleLike($event: boolean, artwork: IArtwork) {
    console.log($event, artwork);
    artwork.like = !artwork.like;
    // this.usersService.setFavorite(artwork.id + "")
    if (!this.usersService.isLogged()) {
      console.log("Usuario no autenticado, no se puede guardar/quitar favoritos.");
      return;
    }
    console.log(artwork.id.toString());
    if (artwork.like) {
      console.log("Guardar");
      await this.usersService.addFavorite(artwork.id.toString());
    } else {
      console.log("Borrar");
      await this.usersService.removeFavorite(artwork.id.toString());
    }
  }

  nextPage(): void {
    
    this.artService.fetchArtworksPage(this.currentPage).subscribe((artworks: IArtwork[]) => {
        this.pagedItems = artworks;
    });

    this.paginationService.updateCurrentPage(this.currentPage);
  }
}
