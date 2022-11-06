import { PoolClient, QueryConfig } from 'pg';
import { query } from './config';
import DbMovie from './model/dbmovie';
import Movie from './model/movie';
import MovieStatus from './model/moviestatus';

const getAllMovies = async (username: string): Promise<DbMovie[]> => {
  const getMoviesQuery: QueryConfig = {
    text: `SELECT m.movie_id,
                  m.title,
                  m.studio,
                  m.director,
                  m.writer,
                  m.duration,
                  m.year,
                  uml.status,
                  uml.score,
                  uml.start_date,
                  uml.end_date,
                  uml.created_on
           FROM user_movie_list uml
                    INNER JOIN movies m USING (movie_id)
           WHERE uml.username = m.submitter
             AND uml.username = $1
           ORDER BY m.title`,
    values: [username],
  };
  const { rows } = await query(getMoviesQuery);
  return rows;
};

const getMovieById = async (movieId: string, username: string): Promise<DbMovie[]> => {
  const getMovieQuery: QueryConfig = {
    text: `SELECT uml.movie_id,
                  m.title,
                  m.studio,
                  m.director,
                  m.writer,
                  m.duration,
                  m.year,
                  uml.status,
                  uml.score,
                  uml.start_date,
                  uml.end_date,
                  uml.created_on
           FROM user_movie_list uml,
                movies m
           WHERE uml.movie_id = m.movie_id
             AND uml.movie_id = $1
             AND m.submitter = $2`,
    values: [movieId, username],
  };
  const { rows } = await query(getMovieQuery);
  return rows;
};

const getMoviesByStatus = async (username: string, status: MovieStatus): Promise<DbMovie[]> => {
  const getMoviesByStatusQuery: QueryConfig = {
    text: `SELECT m.movie_id,
                  m.title,
                  m.studio,
                  m.director,
                  m.writer,
                  m.duration,
                  m.year,
                  uml.status,
                  uml.score,
                  uml.start_date,
                  uml.end_date,
                  uml.created_on
           FROM user_movie_list uml
                    INNER JOIN movies m USING (movie_id)
           WHERE uml.username = m.submitter
             AND uml.username = $1
             AND uml.status = $2
           ORDER BY m.title`,
    values: [username, status],
  };
  const { rows } = await query(getMoviesByStatusQuery);
  return rows;
};

const postMovie = async (client: PoolClient, m: Movie): Promise<string> => {
  const insertMovieQuery: QueryConfig = {
    text: `INSERT INTO movies (title, studio, director, writer, duration, year, submitter)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING movie_id`,
    values: [m.title, m.studio, m.director, m.writer, m.duration, m.year, m.submitter],
  };
  const { rows } = await client.query(insertMovieQuery);
  return rows[0].movie_id;
};

const getTop10Movies = async (username: string): Promise<DbMovie[]> => {
  const getTopMoviesQuery: QueryConfig = {
    text: `SELECT m.movie_id,
                  m.title,
                  m.studio,
                  m.director,
                  m.writer,
                  m.duration,
                  m.year,
                  uml.status,
                  uml.score,
                  uml.start_date,
                  uml.end_date,
                  uml.created_on
           FROM user_movie_list uml
                    INNER JOIN movies m USING (movie_id)
           WHERE uml.username = m.submitter
             AND uml.username = $1
           ORDER BY uml.score DESC
           LIMIT 10;`,
    values: [username],
  };
  const { rows } = await query(getTopMoviesQuery);
  return rows;
};

export { getAllMovies, getMovieById, getMoviesByStatus, postMovie, getTop10Movies };
