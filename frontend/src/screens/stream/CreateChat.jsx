import {
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useChatContext} from 'stream-chat-react-native';
import Toast from 'react-native-toast-message';

const CreateChat = () => {
  const [channelName, setChannelName] = useState('');
  const [chatUsers, setChatUsers] = useState([]);
  const [channelDescription, setChannelDescription] = useState(null);
  const {client} = useChatContext();

  useEffect(() => {
    const fetchUsers = async () => {
      console.log('client', client);

      const response = await client.queryUsers({
        role: 'user',
      });
      setChatUsers(response.users);
      console.log('response', response.users);
    };

    fetchUsers();
  }, []);
  const handleCreateChannel = async () => {
    console.log('channelName', channelName);
    console.log('channelDescription', channelDescription);
    console.log('chatUsers', chatUsers);
    if (channelName.trim() === '' || channelDescription.trim() === '') {
      Toast.show({
        type: 'error',
        text1: 'Please enter channel name and description',
      });
      return;
    }
    const randomId = Math.random().toString(36).substring(2, 15);
    const channel = client.channel('messaging', randomId, {
      name: channelName,
      description: channelDescription,
      created_by: {id: client.user.id},
      image:
        'https://fastly.picsum.photos/id/703/200/200.jpg?hmac=6zWxIBRmIf2e0jZTqvKBIwrc7wm-dPkvGky4go6Yyvg',
      members: [{user_id: client.user?.id, channel_role: 'admin'}],
    });
    channel.create();

    console.log('channel', channel);
    Toast.show({
      type: 'success',
      text1: 'Channel created successfully',
    });
  };

  const handleDirectConversation = async item => {
    const channel = await client.channel(
      'messaging',
      `${client.user.id}-${item.id}`,
      {
        members: [
          {user_id: client.user?.id, channel_role: 'admin'},
          {user_id: item.id, channel_role: 'member'},
        ],
        name:"abc-123"
      },
    );
    channel.create();
    console.log('item', item);
  };
  return (
    <View style={{flex: 1, alignItems: 'center'}}>
      <View style={{height: '10%'}} />
      {/* <Text>Channel Name</Text>
      <TextInput
        value={channelName}
        onChangeText={setChannelName}
        placeholder="Enter channel name"
        style={{borderWidth: 1, borderColor: 'gray', padding: 10, width: '80%'}}
      />
      <Text>Channel Description</Text>
      <TextInput
        value={channelDescription}
        onChangeText={setChannelDescription}
        placeholder="Enter channel description"
        style={{borderWidth: 1, borderColor: 'gray', padding: 10, width: '80%'}}
      />
      <Button
        title="Create Channel"
        onPress={handleCreateChannel}
        style={{width: '80%'}}
      /> */}

      <View style={{width: '100%', borderWidth: 1, borderColor: 'gray'}} />

      <FlatList
        data={chatUsers}
        renderItem={({item}) => (
          <TouchableOpacity
            onPress={() => {
              handleDirectConversation(item);
            }}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        style={{width: '100%'}}
      />
    </View>
  );
};

export default CreateChat;

const styles = StyleSheet.create({});
