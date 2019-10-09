import React from "react";
import PropTypes from "prop-types";

import Headline from "../Article/Headline";
import Bodytext from "../Article/Bodytext";

const Hallitukset = props => {
  const {
    page: {
      html,
      frontmatter: { title }
    },
    theme
  } = props;

  return (
    <React.Fragment>
      <header>
        <Headline title={title} theme={theme} />
      </header>
      <Bodytext html={html} theme={theme} />
    </React.Fragment>
  );
};

Hallitukset.propTypes = {
  page: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

export default Hallitukset;
