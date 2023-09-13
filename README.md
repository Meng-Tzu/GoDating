# GoDating


![Static Badge](https://img.shields.io/badge/license-MIT-blue) ![Static Badge](https://img.shields.io/badge/status-active-green) ![Static Badge](https://img.shields.io/badge/release-v1.0.0-red)

Looking to meet your ideal match? Curious to know who's interested in you? Want to experience real-time chatting? Look no further than GoDating!

**Try It Now** -> [GoDating](https://mengtzu.site) (https://mengtzu.site)

**Test Accounts**

- Email: junggi@test.com / Password: 1234567 (凱光)
- Email: chiao@test.com / Password: 1234567 (小潔)
- Email: purple@test.com / Password: 1234567 (莎莉)
- Email: dragon@test.com / Password: 1234567 (小偉)

![godating](https://github.com/Meng-Tzu/GoDating/assets/111262692/fb5150dd-2949-41b8-b57a-2aa5a140a92a)


## Description

A dating website that offers a personalized recommendation system. It integrates maps to provide approximate locations of candidates, allowing users to have a general idea of their whereabouts. Additionally, this website provides real-time messaging and notifications, as well as a convenient chat record search feature.

## Table of Contents

- [Description](#description)

- [Table of Contents](#table-of-contents)

- [Features](#features)

- [Demo](#demo)

- [Backend Architecture](#backend-architecture)

- [Database Schema](#database-schema)

  - [MySQL](#mysql)

  - [Elasticsearch](#elasticsearch)

- [Roadmap](#roadmap)

- [Contact Information](#contact-information)

- [Contribution](#contribution)

## Features

[(Back to top)](#godating)

- **Algorithm**

  Suitable candidates are filtered based on gender, sexual orientation and age, and then sorted according to their interest tags using the `Jaccard Similarity` algorithm.

- **Communication**

  Implementing real-time delivery of system notifications and instant messaging between users by `Socket.IO` technology.

- **Search**

  Searching chat records efficiently with `Elasticsearch`, and supporting fuzzy search functionality.

- **Location**

  Visualizing the geographic locations of users and their candidates on an interactive map using `Leaflet API`.

## Demo

[(Back to top)](#godating)

  - ### Show Candidate Location

    ![map](https://github.com/Meng-Tzu/GoDating/assets/111262692/07077699-6f88-445a-a5ea-1916101867d5)

  - ### Chatroom

    ![chat](https://github.com/Meng-Tzu/GoDating/assets/111262692/3be79b31-5ebe-45af-91ea-7b072f74dd79)

  - ### Search for Relevant Chat Record

    ![search](https://github.com/Meng-Tzu/GoDating/assets/111262692/edaf31ff-e25e-419a-9a08-a57238afd136)


## Backend Architecture

[(Back to top)](#godating)

![backend_architecture](https://github.com/Meng-Tzu/GoDating/assets/111262692/236a1b9d-da4a-449d-8f9d-2058da536127)

## Database Schema

[(Back to top)](#godating)

### MySQL

- **User information**

  ![mysql_schema_v2](https://github.com/Meng-Tzu/GoDating/assets/111262692/07ca90cc-5947-4ae4-bd66-f349c0dda99a)


### Elasticsearch

- **Chat record**
  ```json
  {
    "userId": {
      "type": "integer"
    },
    "userName": {
      "type": "text"
    },
    "message": {
      "type": "text"
    },
    "timestamp": {
      "type": "text"
    },
    "time": {
      "type": "date",
      "format": "epoch_millis"
    }
  }
  ```

## Roadmap

[(Back to top)](#godating)

- **Geolocation-based Matchmaking** : Display candidates within a specific range based on the user's provided location.

- **Customizable Filtering Criteria** : Allow users to modify their preferences to discover different potential candidates.

- **Diversified Sexual Orientation Options** : Expand the range of sexual orientation options in the questionnaire survey to supports users in finding compatible partners.

## Contact Information

[(Back to top)](#godating)

- Name: Meng-Tzu Tsai 蔡孟慈

- Email: mengtzu07@gmail.com

- LinkedIn: https://linkedin.com/in/meng-tzu-tsai

If you have any suggestion or brilliant ideas to GoDating website, feel free to contact me!

## Contribution

[(Back to top)](#godating)

- Special thanks to [Flaticon](https://www.flaticon.com) for providing free icons.

- Special thanks to [Unsplash](https://unsplash.com) and [Pexels](https://www.pexels.com/zh-tw) for providing free photographs.

- Special thanks to [CGFace](https://cgfaces.com/en) for providing free AI-generated portrait images.

- Special thanks to [Storyset](https://storyset.com/) for providing free animate illustrations.
