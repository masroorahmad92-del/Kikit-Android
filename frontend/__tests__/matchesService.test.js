import {matchesService} from '../src/api/services/matchesService';
import {api} from '../src/api/interceptor';

jest.mock('../src/api/interceptor', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('matchesService Sparks API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches Discover profiles with filters and pagination', () => {
    const params = {
      category_id: 'category-1',
      interest_id: 'interest-1',
      limit: 20,
      offset: 20,
    };

    matchesService.getDiscover(params);

    expect(api.get).toHaveBeenCalledWith('matches/discover', {params});
  });

  it('fetches Discover profiles with a single chip filter', () => {
    const params = {category_id: 'category-1', limit: 20, offset: 0};

    matchesService.getDiscover(params);

    expect(api.get).toHaveBeenCalledWith('matches/discover', {params});
  });

  it('sends a Spark without using the toggle-like endpoint', () => {
    const sparkData = {
      spark_question: 'What would you explore together?',
      spark_answer: 'A small gallery crawl.',
    };

    matchesService.sendSpark('profile-1', sparkData);

    expect(api.post).toHaveBeenCalledWith(
      'profile-likes/profile-1/spark',
      sparkData,
    );
  });
});
