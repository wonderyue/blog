---
layout: post
title: "Build an ecommerce website with React and Django (1)"
subtitle: "Things I should know earlier"
date: 2020-04-07 10:21:29 +0800
comments: true
toc: true
header-img: "/img/header_img/markus-spiske-Skf7HxARcoc-unsplash.jpg"
categories: "coding"
tag: ["react","django"]
---

I start learning full-stack development by building an eCommerce website with React and Django.

[Project Repository](https://github.com/wonderyue/Autocart)

[Demo](https://autocart.rj.r.appspot.com/)

Features:

- authentication
- product list
- cart
- order history
- rating and comment
- edit mode for administrator

This is the first one of a serial of articles, and I'd like to talk about things I should know earlier.


## Packages(Lifesavers) I should know earlier

### 1. react-moment 
<!-- [react-moment](https://www.npmjs.com/package/react-moment) -->

  I use DateTimeField in Django model, and it saved as a string like "2020-04-11T18:36:05.748Z" in database. It is hard to display it in the frontend. I add another read-only field when serializing the model, convert the DateTimeField value to timestamp. And create a Date object in the frontend. Then, I find this package, and revert what I have done...
  
  And it is also useful when you need to display "post a minute/two days ago" in a comment or feed component.

<!--more-->

### 2. react-responsive-carousel 
<!-- [react-responsive-carousel](https://www.npmjs.com/package/react-responsive-carousel) -->

  I use semantic-ui as style framework, sadly there is no carousel component. There is an official [solution](https://github.com/express-labs/pure-react-carousel), but that's not what I want. I tried to modify it, cost me a lot of time. Make me wondering what am I doing, why not give me a simple and elegant component like [bootstrap](https://getbootstrap.com/docs/4.0/components/carousel/) does. Finally, I find [react-responsive-carousel](https://www.npmjs.com/package/react-responsive-carousel). Nice component, especially the thumbnails, awesome.
  
  ![carousel](carousel.png)

### 3. babel-plugin-root-import 
<!-- [babel-plugin-root-import](https://www.npmjs.com/package/babel-plugin-root-import) -->

  > import xxxx from '../../../xx/xxx';

  If you don't like to write something like the above, you should install this package. 

### 4. immutability-helper
<!-- [immutability-helper](https://github.com/kolodny/immutability-helper) -->

  If you need to update a flat state, you can simply set value. But if a state contains arrays or key-value objects, you should use immutability-helper. Its syntax is like mongoDB update. If you don't know why you need immutability-helper, you should read [this](https://reactjs.org/docs/optimizing-performance.html#using-immutable-data-structures).

### 5. react-currency-format
<!-- [react-currency-format](https://www.npmjs.com/package/react-currency-format) -->

  > $100,000
  
  Save your time on this.

## Tips(Tricks) I should know earlier

### 1. reusable action/reducer for redux

I first developed product list, then shopping cart. They don't share anything common. Product list needs to fetch a list of data with parameters of pageNumber, orderBy, and filters. Shopping cart has simple CRUD apis. Later I worked on order list, which has pagination and CRUD. When I copy, paste, and modify similar codes, I start thinking about what am I doing. I am a programmer(lazy), I should be clever(lazier). Let's refactor.

Inspired by [Five Tips for Working with Redux in Large Applications](https://medium.com/xandr-tech/five-tips-for-working-with-redux-in-large-applications-89452af4fdcb).


```js PaginationAction
const PaginationAction = (prefix, url) => ({
  changeParam: (type, value) => {
    return {
      type: addPrefix(prefix, type),
      payload: value,
    };
  },

  getOnePage: (countPerPage, curPage, filters = {}) => (dispatch, getState) => {
    const offset = countPerPage * (curPage - 1);
    const request = withToken ? clientRequestWithToken : clientRequest;
    let param = "";
    Object.keys(filters).map((key, index) => {
      if (filters[key] != undefined) param += `&${key}=${filters[key]}`;
    });
    return request({
      method: "get",
      url: url + "?limit=" + countPerPage + "&offset=" + offset + param,
    }).then((res) => {
      dispatch({
        type: addPrefix(prefix, GET_ONE_PAGE),
        payload: res,
      });
    });
  },
});

export default PaginationAction;
```


```js PaginationReducer
export const TYPE_2_PROP = {
  [CHANGE_PAGE]: "curPage",
  [CHANGE_COUNT_PER_PAGE]: "countPerPage",
  [CHANGE_ORDER]: "ordering",
  [CHANGE_BRAND]: "brand",
  [CHANGE_CATEGORY]: "category",
  [CHANGE_SEARCH]: "search",
  [CHANGE_MIN_PRICE]: "price__gte",
  [CHANGE_MAX_PRICE]: "price__lte",
  [CHANGE_ENABLE]: "enable",
};

const defaultInitState = {
  count: 0,
  list: [],
  curPage: 1,
  countPerPage: 10,
  filters: {},
};

const PaginationReducer = (prefix, initState = defaultInitState) => (
  state = initState,
  action
) => {
  const type = trimPrefix(prefix, action.type);
  if (type == GET_ONE_PAGE) {
    return {
      ...state,
      count: action.payload.count,
      list: action.payload.results,
    };
  } else if (type == CHANGE_PAGE || type == CHANGE_COUNT_PER_PAGE) {
    return {
      ...state,
      [TYPE_2_PROP[type]]: action.payload,
    };
  } else if (TYPE_2_PROP[type]) {
    return {
      ...state,
      filters: {
        ...state.filters,
        [TYPE_2_PROP[type]]: action.payload,
      },
    };
  } else return state;
};

export default PaginationReducer;
```

how to use:
```
//create
export const OrderListAction = PaginationAction("OrderList", ORDER_URL);

//connect
export default connect(mapStateToProps, {
  getOnePage: OederListAction.getOnePage,
  changeParam: OrderListAction.changeParam,
})(ACOrderHistoryView);

//combineReducer
OrderList: Pagination("OrderList", {
  count: 0,
  list: [],
  curPage: 1,
  countPerPage: 10,
  filters: {
    ordering: "-createTime",
  },
}),
```
You can create a CRUD action in the same way.
```js ModelAction
const ModelAction = (prefix, url) => ({
  list: () => {...}

  create: (obj) => {...}
    
  retrieve: (id) => {...}

  update: (id, obj) => {...}

  delete: (id) => {...}
});
```
### 2. static assets management

At first, I use webpack to control output directory. It's not hard, but favicon is a trouble, you need another plugin to handle it. For example, I use copy-webpack-plugin. 

Later, I need an upload images function. I found Django has ImageField which is not compatible with the solution I used before. And I have to say, Django's [MEDIA_ROOT](https://docs.djangoproject.com/en/3.0/ref/settings/#std:setting-MEDIA_ROOT) is much easier.