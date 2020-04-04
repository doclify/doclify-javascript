export default class Cache {
  constructor (options) {
    this.config = Object.assign({
      maxSize: Infinity,
      maxLength: Infinity,
      maxAge: 0,
      getSize () {
        return 1
      }
    }, options || {})

    this.entries = new Map()
    this.size = 0
    this.newest = this.oldest = undefined
  }

  reset () {
    this.entries.clear()
    this.size = 0
    this.newest = this.oldest = undefined
  }

  get length () {
    return this.entries.size
  }

  has (key) {
    return this.entries.has(key)
  }

  get (key) {
    const entry = this.entries.get(key)

    if (!entry) {
      return
    }

    if (entry.maxAge && Date.now() - entry.now > entry.maxAge * 1000) {
      this.delete(entry)

      return
    }

    return entry.value
  }

  set (key, value, options = {}) {
    const maxAge = options.maxAge || this.config.maxAge

    if (maxAge && typeof maxAge !== 'number') {
      throw new TypeError('maxAge must be a number')
    }

    const size = typeof options.size === 'number' ? options.size : this.config.getSize(value, key)

    if (size > this.config.maxSize) {
      if (this.has(key)) {
        this.delete(key)
      }

      return false
    }

    let entry = this.entries.get(key)

    if (!entry) {
      entry = new Entry(key, value, size, maxAge)

      this.entries.set(key, entry)

      if (this.newest) {
        this.newest.newer = entry
        entry.older = this.newest
      } else {
        this.oldest = entry
      }
    } else {
      this.size -= entry.size
      entry.update(value, size, maxAge)

      this.markEntryAsUsed(entry)
    }

    this.size += size
    this.newest = entry

    this.cleanup()

    return true
  }

  markEntryAsUsed (entry) {
    if (entry === this.newest) {
      // Already the most recenlty used entry, so no need to update the list
      return
    }

    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
      if (entry === this.oldest) {
        this.oldest = entry.newer
      }

      entry.newer.older = entry.older // C <-- E.
    }
    if (entry.older) {
      entry.older.newer = entry.newer // C. --> E
    }
    entry.newer = undefined // D --x
    entry.older = this.newest // D. --> E

    if (this.newest) {
      this.newest.newer = entry // E. <-- D
    }

    this.newest = entry
  }

  delete (keyOrEntry) {
    const entry = keyOrEntry instanceof Entry ? keyOrEntry : this.entries.get(keyOrEntry)

    if (!entry) {
      return false
    }

    this.size -= entry.size
    entry.size = 0
    entry.newer = entry.older = undefined

    return this.entries.delete(entry.key)
  }

  cleanup () {
    while (this.length > this.config.maxLength || this.size > this.config.maxSize) {
      if (!this.shift()) {
        break
      }
    }
  }

  shift () {
    const entry = this.oldest

    if (!entry) {
      return false
    }

    if (this.oldest.newer) {
      // advance the list
      this.oldest = this.oldest.newer
      this.oldest.older = undefined
    } else {
      // the cache is exhausted
      this.oldest = undefined
      this.newest = undefined
    }

    this.delete(entry)

    return true
  }
}

class Entry {
  constructor (key, value, size, maxAge) {
    this.key = key
    this.newer = this.older = null

    this.update(value, size, maxAge)
  }

  update (value, size, maxAge) {
    this.value = value
    this.size = size
    this.maxAge = maxAge
    this.now = maxAge ? Date.now() : null
  }
}
