import {
  MAX_STACK_DEPTH,
  Route,
  currentRoute,
  popRoute,
  pushRoute,
} from '../src/ui/navigation';

const home: Route = {name: 'home'};
const movies: Route = {name: 'movies'};
const movie: Route = {name: 'movie', id: 'm1'};
const player: Route = {name: 'player', target: {} as never};

describe('pile de navigation', () => {
  it('empile et dépile', () => {
    const stack = pushRoute(pushRoute([home], movies), movie);

    expect(currentRoute(stack).name).toBe('movie');
    expect(currentRoute(popRoute(stack)).name).toBe('movies');
  });

  it('ne dépile jamais la racine', () => {
    expect(popRoute([home])).toEqual([home]);
  });

  it('borne la profondeur en gardant les écrans les plus récents', () => {
    let stack: Route[] = [home];
    for (let i = 0; i < MAX_STACK_DEPTH + 5; i += 1) {
      stack = pushRoute(stack, {name: 'movie', id: `m${i}`});
    }

    expect(stack).toHaveLength(MAX_STACK_DEPTH);
    expect(currentRoute(stack)).toEqual({
      name: 'movie',
      id: `m${MAX_STACK_DEPTH + 4}`,
    });
  });

  it('ramène au bon écran depuis le lecteur selon le chemin emprunté', () => {
    const fromMovieDetail = pushRoute(
      pushRoute(pushRoute([home], movies), movie),
      player,
    );
    const fromLive = pushRoute(pushRoute([home], {name: 'live'}), player);

    expect(currentRoute(popRoute(fromMovieDetail)).name).toBe('movie');
    expect(currentRoute(popRoute(fromLive)).name).toBe('live');
  });
});
