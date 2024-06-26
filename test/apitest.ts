import request from 'supertest';
import * as chai from 'chai';
import app from '../src/index.js';
import { Done } from 'mocha';

const expect = chai.expect;

describe('API Tests', () => {
  let userId: number;
  let eventId: number;
  let ticketId: number;

  before((done) => {
    // Initialize the server or database if needed
    done();
  });


  
  it('should create a new user', (done: Done) => {
    request(app)
      .post('/users')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' })
      .expect(201)
      .end((err: Error, res: any) => {
        if (err) return done(err);
        expect(res.body).to.have.property('id');
        userId = res.body.id;
        done();
      });
  });

  it('should create a new event', (done) => {
    request(app)
      .post('/events')
      .send({ name: 'EventName', date: '2024-07-01', category: 'Game', availableSeats: 100 })
      .expect(201)
      .end(() => {
        done();
      });
  });

  it('should create a new ticket', (done) => {
    request(app)
      .post(`/events/${eventId}/tickets`)
      .send({ seat: 'A1', price: 50, userId })
      .expect(201)
      .end(() => {
        done();
      });
  });

  it('should get all users', (done) => {
    request(app)
      .get('/users')
      .expect(200)
      .end(() => {
        done();
      });
  });

  it('should search events by category', (done) => {
    request(app)
      .get('/events?category=Game')
      .expect(200)
      .end(() => {
        done();
      });
  });

  it('should get tickets for an event', (done) => {
    request(app)
      .get(`/events/${eventId}/tickets`)
      .expect(200)
      .end(() => {
        done();
      });
  });

  it('should update a ticket', (done) => {
    request(app)
      .put(`/events/${eventId}/tickets/${ticketId}`)
      .send({ seat: 'A2', price: 60, userId })
      .expect(200)
      .end(() => {
        done();
      });
  });

  it('should delete a ticket', (done) => {
    request(app)
      .delete(`/events/${eventId}/tickets/${ticketId}`)
      .expect(200)
      .end(() => {
        done();
      });
  });
});
