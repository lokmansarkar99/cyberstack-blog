import React from 'react'
import { Link } from 'react-router-dom'
import PostAuthor from './PostAuthor'

const PostItem = ({ postID, category, title, description, creator, thumbnail,createdAt }) => {
  const shortDescription = description.length > 145 ? description.substr(0, 145) + '...' : description;
  const shortTitle = title.length > 30 ? title.substr(0, 30) + '...' : title;
  return (
    <div>
      <article className="post">
        <div className="post__thumbnail">
          <img
            src={thumbnail}
            alt="Thumbnail"
          />
        </div>

        <div className="post__content">
          <Link to={`/posts/${postID}`}>
            {' '}
            <h3> {shortTitle} </h3>
          </Link>

          <p> <div dangerouslySetInnerHTML={{ __html:shortDescription }} /> </p>
          <div className="post__footer">
            <PostAuthor creator={creator} createdAt={createdAt} />
            <Link to={`/posts/categories/${category}`} className="btn category">
              {' '}
              {category}{' '}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}

export default PostItem
