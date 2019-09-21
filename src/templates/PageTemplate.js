import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Seo from "../components/Seo";
import Article from "../components/Article";
import Hero from "../components/Hero";
import Page from "../components/Page";
import { ThemeContext } from "../layouts";

const PageTemplate = props => {
  const {
    data: {
      bgDesktop: {
        resize: { src: desktop }
      },
      bgTablet: {
        resize: { src: tablet }
      },
      bgMobile: {
        resize: { src: mobile }
      },
      page,
      site: {
        siteMetadata: { facebook }
      }
    }
  } = props;

  const backgrounds = {
    desktop,
    tablet,
    mobile
  };

  return (
    <React.Fragment>
      <ThemeContext.Consumer>
        {theme => (
          <>
            <Hero backgrounds={backgrounds} theme={theme} />

            <Article theme={theme}>
              <Page page={page} theme={theme} />
            </Article>
          </>
        )}
      </ThemeContext.Consumer>

      <Seo data={page} facebook={facebook} />
    </React.Fragment>
  );
};

PageTemplate.propTypes = {
  data: PropTypes.object.isRequired
};

export default PageTemplate;

//eslint-disable-next-line no-undef
export const pageQuery = graphql`
  query PageByPath($slug: String!) {
    page: markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      html
      frontmatter {
        title
      }
    }
    site {
      siteMetadata {
        facebook {
          appId
        }
      }
    }
    bgDesktop: imageSharp(fluid: { originalName: { regex: "/three/" } }) {
      resize(width: 1200, quality: 90, cropFocus: CENTER) {
        src
      }
    }
    bgTablet: imageSharp(fluid: { originalName: { regex: "/three/" } }) {
      resize(width: 800, height: 1100, quality: 90, cropFocus: CENTER) {
        src
      }
    }
    bgMobile: imageSharp(fluid: { originalName: { regex: "/three/" } }) {
      resize(width: 450, height: 850, quality: 90, cropFocus: CENTER) {
        src
      }
    }
  }
`;
