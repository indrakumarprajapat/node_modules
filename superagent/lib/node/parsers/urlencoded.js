"use strict";

/**
 * Module dependencies.
 */

const qs = require('qs');
module.exports = (res, fn) => {
  res.text = '';
  res.setEncoding('ascii');
  res.on('data', chunk => {
    res.text += chunk;
  });
  res.on('end', () => {
    try {
      fn(null, qs.parse(res.text));
    } catch (err) {
      fn(err);
    }
  });
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJxcyIsInJlcXVpcmUiLCJtb2R1bGUiLCJleHBvcnRzIiwicmVzIiwiZm4iLCJ0ZXh0Iiwic2V0RW5jb2RpbmciLCJvbiIsImNodW5rIiwicGFyc2UiLCJlcnIiXSwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbm9kZS9wYXJzZXJzL3VybGVuY29kZWQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICovXG5cbmNvbnN0IHFzID0gcmVxdWlyZSgncXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAocmVzLCBmbikgPT4ge1xuICByZXMudGV4dCA9ICcnO1xuICByZXMuc2V0RW5jb2RpbmcoJ2FzY2lpJyk7XG4gIHJlcy5vbignZGF0YScsIChjaHVuaykgPT4ge1xuICAgIHJlcy50ZXh0ICs9IGNodW5rO1xuICB9KTtcbiAgcmVzLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGZuKG51bGwsIHFzLnBhcnNlKHJlcy50ZXh0KSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBmbihlcnIpO1xuICAgIH1cbiAgfSk7XG59O1xuIl0sIm1hcHBpbmdzIjoiOztBQUFBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNQSxFQUFFLEdBQUdDLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFFeEJDLE1BQU0sQ0FBQ0MsT0FBTyxHQUFHLENBQUNDLEdBQUcsRUFBRUMsRUFBRSxLQUFLO0VBQzVCRCxHQUFHLENBQUNFLElBQUksR0FBRyxFQUFFO0VBQ2JGLEdBQUcsQ0FBQ0csV0FBVyxDQUFDLE9BQU8sQ0FBQztFQUN4QkgsR0FBRyxDQUFDSSxFQUFFLENBQUMsTUFBTSxFQUFHQyxLQUFLLElBQUs7SUFDeEJMLEdBQUcsQ0FBQ0UsSUFBSSxJQUFJRyxLQUFLO0VBQ25CLENBQUMsQ0FBQztFQUNGTCxHQUFHLENBQUNJLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTTtJQUNsQixJQUFJO01BQ0ZILEVBQUUsQ0FBQyxJQUFJLEVBQUVMLEVBQUUsQ0FBQ1UsS0FBSyxDQUFDTixHQUFHLENBQUNFLElBQUksQ0FBQyxDQUFDO0lBQzlCLENBQUMsQ0FBQyxPQUFPSyxHQUFHLEVBQUU7TUFDWk4sRUFBRSxDQUFDTSxHQUFHLENBQUM7SUFDVDtFQUNGLENBQUMsQ0FBQztBQUNKLENBQUMifQ==