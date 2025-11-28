
class Group {
	constructor(group, fixtures) {
		this.name = group.name;
		this.fixture_indexes = group.fixture_indexes;
		this.fixtures = fixtures.filter((f, i) => group.fixture_indexes.includes(i));
	}

	subverses() {
    return this.fixtures.map((f) => f.subverse());
	}

	updateChannels(values) {
    this.fixtures.forEach((f) => f.updateChannels(values));
	}
	
	getChannelValues(channels) {
		let channel_values = [];
    this.fixtures.forEach((f) => {
      let channel_v = f.getChannelValues(channels);
      if (channel_v != null && channel_v.length > 0) {
        channel_values.push(channel_v);
      }
    });
		
		return channel_values;
	}
}

export {Group};
