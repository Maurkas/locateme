import React from 'react';
import './Footer.css'
import { Link } from 'react-router-dom';
import { MDBFooter, MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFacebook, faSquareXTwitter, faGoogle, faInstagram, faGithub } from '@fortawesome/free-brands-svg-icons'
import {faHouse, faEnvelope, faPhone, faPrint, faKeyboard} from "@fortawesome/free-solid-svg-icons"

export default function Footer() {
  return (
    <MDBFooter bgColor='light' className='text-center text-lg-start text-muted'>
      <section className='d-flex justify-content-center justify-content-lg-between p-4 border-bottom'>
        <div className='me-5 d-none d-lg-block'>
          <span>Свяжитесь с нами в социальных сетях:</span>
        </div>

        <div>
          <a href='https://www.facebook.com' className='me-4 text-reset'>
            <FontAwesomeIcon icon={faFacebook} style={{color: "#000000",}} />
          </a>
          <a href='https://twitter.com/maurkas88' className='me-4 text-reset'>
            <FontAwesomeIcon icon={faSquareXTwitter} style={{color: "#000000",}} />
          </a>
          <a href='https://google.com' className='me-4 text-reset'>
            <FontAwesomeIcon icon={faGoogle} style={{color: "#000000",}} />
          </a>
          <a href='https://www.instagram.com/maurkas1/' className='me-4 text-reset'>
            <FontAwesomeIcon icon={faInstagram} style={{color: "#000000",}} />
          </a>
          <a href='https://github.com/emok1d' className='me-4 text-reset last-icon'>
            <FontAwesomeIcon icon={faGithub} style={{color: "#000000",}} />
          </a>
        </div>
      </section>

      <section className=''>
        <MDBContainer fluid className='text-center text-md-start mt-5'>
          <MDBRow className='mt-3'>
            <MDBCol md='3' lg='4' xl='3' className='mx-auto mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>
                LocateMe
              </h6>
              <p>
              Подбери недвижимость под свои потребности.
              </p>
            </MDBCol>

            

            <MDBCol md='4' lg='3' xl='3' className='mx-auto mb-md-0 mb-4'>
              <h6 className='text-uppercase fw-bold mb-4'>Контакты</h6>
              <p>
                <FontAwesomeIcon icon={faHouse} style={{color: "#000000",}} className='me-2' />
                New York, NY 10012, US
              </p>
              <p>
                <FontAwesomeIcon icon={faEnvelope} style={{color: "#000000",}} className='me-3' />
                info@example.com
              </p>
              <p>
                <FontAwesomeIcon icon={faPhone} style={{color: "#000000",}} className='me-3' />
                + 01 234 567 88
              </p>
              <p>
                <FontAwesomeIcon icon={faPrint} style={{color: "#000000",}} className='me-3' />
                + 01 234 567 89
              </p>
            </MDBCol>
          </MDBRow>
        </MDBContainer>
      </section>

      <div className='text-center p-4' style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}>
        © 2024 Copyright:
        <a className='text-reset fw-bold' href='https://mdbootstrap.com/'>
          LocateMe.com
        </a>
      </div>
    </MDBFooter>
  );
}